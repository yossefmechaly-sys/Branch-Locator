# DSM Production Gate — Report

Scope: close the five remaining Phase 11 blockers through genuine execution
(Gates A–T). No product functionality was added or changed. Every command
below was actually run in this session; nothing is inferred from prior
conversation. Where a gate could not complete, the exact command, exact
error, and root cause are reported — never approximated, never worked
around.

**Headline finding**: this sandbox's organizational egress policy blocks
**all external container registries** (not just Docker Hub — `ghcr.io`,
`mcr.microsoft.com`, `gcr.io` were each independently probed this session and
all three return the identical `403`/`connect_rejected` as Docker Hub) in
addition to the already-known `binaries.prisma.sh` block. Because `prisma
generate` is a hard prerequisite for Gates D through N and P, and a base
image pull is a hard prerequisite for Gates O–P, this single infrastructure
boundary — not any application defect — is what keeps most of this gate list
from completing here. Gates A, C (partial), G (lint/unit only), Q, R, and S
were fully executable and were fully executed.

---

## 1. Environment used

Same cloud sandbox as Phase 11 (containerized Linux, nested Docker-in-Docker
available), re-verified fresh this session rather than assumed from the
Phase 11 conversation. PostgreSQL 16 server software is installed locally
(not merely the client) and was started for real this session — new
information versus Phase 11, where only the `psql` client had been exercised
against throwaway files, never a running local server.

## 2. Node/npm versions

- Node: `v22.22.2`
- npm: `10.9.7`

## 3. Prisma generation result — GATE B: **BLOCKED (infrastructure)**

```
$ npx prisma generate
Error: Failed to fetch sha256 checksum at
https://binaries.prisma.sh/all_commits/0edf323efd1d98336f3f0a68684b56f689b900d3/debian-openssl-3.0.x/schema-engine.sha256 - 403 Forbidden
```

Confirmed via the agent-proxy's own status endpoint (`recentRelayFailures`):
`"gateway answered 403 to CONNECT (policy denial or upstream failure)"` for
`binaries.prisma.sh:443`, six consecutive attempts, all identical. Also
confirmed there is no alternate, already-permitted distribution channel for
the engine binary: `npm ci` installs `@prisma/engines`/`@prisma/fetch-engine`
(the *downloader* library) but no platform-specific engine binary ships as an
npm package for this Prisma version — the fetch to `binaries.prisma.sh` is
unconditional, even for `npx prisma -v`. No workaround was attempted
(`PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING` was not set, no alternate mirror
substituted).

`npx prisma validate` and `npx prisma format --check` fail identically (same
host, same 403).

## 4. Prisma validation result

Not reachable — identical to §3.

## 5. PostgreSQL version

**16.13** (Ubuntu build), started for real this session via the local
`postgresql` service (`service postgresql start`) against the pre-installed
cluster at `/var/lib/postgresql/16/main`. Confirmed live with
`SELECT version()` through `psql`. This is a genuine local PostgreSQL server
process, not a container/mock, and is fully independent of the
`binaries.prisma.sh` block — it is Prisma's own CLI/client that could not
reach it, not the other way around.

A dedicated local role (`dsm_gate`) and two throwaway databases
(`dsm_gate_empty`, `dsm_gate_existing`) were created for this gate, used, and
dropped again at the end of this session — never a shared or persistent
database, and the local-only password was never printed in any command
output shown above or reused anywhere else.

## 6. Empty DB migration result — GATE D: **BLOCKED (infrastructure)**

```
$ DATABASE_URL=postgresql://dsm_gate:***@localhost:5432/dsm_gate_empty npx prisma migrate deploy
Error: Failed to fetch sha256 checksum at https://binaries.prisma.sh/.../schema-engine.sha256 - 403 Forbidden
```

`prisma migrate deploy` needs the same schema-engine binary as `generate` —
it never even attempts to reach PostgreSQL; it fails at the identical engine-fetch
step. Per the explicit instruction for this gate, **no raw-SQL substitute was
applied** — Gate D is reported as not executed via the real CLI, full stop.
(The real, running PostgreSQL 16 instance from §5 was ready and reachable;
only the Prisma CLI itself could not proceed.)

## 7. Existing DB migration result — GATE E: **BLOCKED (infrastructure, cascades from Gate D)**

`prisma migrate dev`/`deploy` are the same command family, same engine
dependency — re-running the identical command against a second throwaway
database would reproduce the identical error, so it was not repeated. Per
the explicit instruction, the Phase 11 raw-SQL verification is **not**
treated as satisfying this stricter gate, which specifically requires the
actual Prisma migration workflow. This remains unexecuted here.

## 8. Seed result — GATE F: **BLOCKED (infrastructure, cascades)**

```
$ DATABASE_URL=... npx prisma db seed
Error: Failed to fetch sha256 checksum ... 403 Forbidden
```

Additionally isolated exactly how far the failure reaches by invoking the
seed script directly, bypassing the Prisma CLI wrapper:

```
$ DATABASE_URL=... npx tsx prisma/seed.ts
Error: Cannot find module '.prisma/client/default'
```

This confirms the break is at the generated-client level, not merely the CLI
orchestration layer — `@prisma/client`'s own entry point has nothing to
`require` because `prisma generate` has never once succeeded, in any
environment, for this project.

## 9. Seed idempotency

Not testable — depends on §8.

## 10. TypeScript result — GATE G (typecheck half): **NOT MET — cascades from Gate B**

```
$ npx tsc --noEmit
lib/prisma.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'.
prisma/seed.ts(14,10): error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'.
prisma/seed.ts(14,29): error TS2305: Module '"@prisma/client"' has no exported member 'Locale'.
```

Identical 3 errors, identical to Phase 11 — Gate G's stated expectation
("ZERO TypeScript errors") is **not met**, and per the defect policy this is
explicitly *not* reclassified as an application defect: it is the direct,
sole, and fully explained consequence of Gate B never completing. No other
TypeScript error exists anywhere in the project.

## 11. ESLint result

```
$ npx eslint .
4 problems (0 errors, 4 warnings)
```

**0 errors.** The 4 warnings are the same pre-existing, unrelated warnings
reported at the end of Phase 11 (an unused eslint-disable directive, one
unused type import, two unused destructured test parameters) — none in files
touched by this gate or by the Phase 11 concurrency work.

## 12. Vitest exact result

```
$ npm ci   # fresh install, 789 packages, 59s, no lockfile drift
$ npx vitest run
 Test Files  81 passed (81)
      Tests  646 passed (646)
   Duration  91.25s
```

**646 passed, 0 failed, 0 skipped**, across 81 files — run against a
completely fresh `npm ci` install this session (not a reused `node_modules`
from Phase 11), confirming no drift. No test was deleted or weakened to
reach this number.

## 13. Next.js build result — GATE H: **NOT MET — cascades from Gate B**

```
$ rm -rf .next && npx next build
✓ Compiled successfully in 23.2s
  Running TypeScript ...
lib/prisma.ts(1,10): error TS2305: ...
Failed to type check.
```

Bundling succeeds; the build **does not complete** (per the gate's own
explicit definition — "a build that stops after bundling but fails during
type checking is NOT a successful build"). Confirmed no `.next/standalone`
directory was produced. `output: "standalone"` (added in Phase 11) cannot be
validated end-to-end here because the build itself never finishes.

## 14. Application startup result — GATE I: **NOT ATTEMPTED (no valid build to start)**

Since Gate H did not produce a complete, typechecked build, starting `next
start`/the standalone server against it would not be a meaningful validation
of production behavior — it was not attempted rather than staged as false
evidence.

## 15. Health check

The **route handler itself** was verified for real at the unit level (not
mocked reimplementation — the actual `GET` function from
`app/api/health/route.ts`, only its Prisma call boundary mocked):
`tests/unit/api-health.test.ts` proves (a) `200`/`{status:"ok"}` when the DB
call succeeds, and (b) `503`/`{status:"degraded"}` when it rejects, with an
explicit assertion that the response body contains only `status`/`timestamp`
keys and never the raw error text (tested with a rejection message
containing a fake password and hostname, confirmed absent from the JSON
response). A live check against a really-running server was not possible —
cascades from §14.

## 16. Public smoke tests

Not executable — cascades from §14 (no running server).

## 17. Admin smoke tests

Not executable — cascades from §14.

## 18. Phase 9 Playwright result

Not executed — requires a running application against real PostgreSQL
(§14). `tests/e2e/admin-full-journey.spec.ts` exists and is unchanged.

## 19. Analytics Playwright result

Not executed, same reason. `tests/e2e/admin-analytics-journey.spec.ts`
exists and is unchanged.

## 20. Import Playwright result

Not executed, same reason. `tests/e2e/admin-import-journey.spec.ts` exists
and is unchanged, including its assertion that an update import without
`hours_*` columns must not erase existing opening hours (Phase 10
regression guarantee) — unverified live this session, not regressed in
source.

## 21. Complete Playwright count

3 permanent spec files, 0 executed this session (all blocked by §14).

## 22. Real transaction validation — GATE L

**Not met at the "real PostgreSQL-backed application" level required by this
gate** — that requires §14. What *was* additionally re-confirmed this
session, honestly labeled as not satisfying this gate on its own: the
646/646 mocked-Prisma unit tests (§12) still include, per domain
(Branch/Promotion/Service/City), the atomic-increment assertion and the
two-client stale-version simulation added in Phase 11 — unchanged, still
passing, but explicitly a mock-level guarantee, not the real-PostgreSQL
proof this gate asks for.

## 23. Optimistic concurrency validation

Same status as §22 — the application-level mechanism (schema, migration SQL,
service code) was authored and reviewed in Phase 11 and is unchanged; genuine
end-to-end proof against a live app + real PostgreSQL remains blocked by §14.

## 24. Decimal validation — GATE M: **Partially met**

The database-level half **was** verified for real this session, independent
of Prisma, directly against the live PostgreSQL 16 instance from §5:

```sql
CREATE TABLE decimal_probe (id serial primary key, price NUMERIC(10,2));
INSERT INTO decimal_probe (price) VALUES (29.90), (0.10), (9999.99);
SELECT id, price, price::text FROM decimal_probe ORDER BY id;
--  1 |   29.90 | 29.90
--  2 |    0.10 | 0.10
--  3 | 9999.99 | 9999.99
```

No drift (`NUMERIC(10,2)` is exact fixed-point in PostgreSQL, unlike a
float) — matches `prisma/schema.prisma`'s `Promotion.price`/`originalPrice`
type exactly (`Decimal @db.Decimal(10, 2)`). Source inspection confirms the
application layer never converts through `Number()`/`parseFloat()`
(`services/admin/promotion-admin.service.ts` header comment: "transitent
comme chaînes décimales de bout en bout, jamais `Number(...)` ni
`parseFloat(...)`"). What remains unverified: the actual rendered
public/admin page output through a live server — cascades from §14.

## 25. Jerusalem timezone validation — GATE N: **Partially met**

`Asia/Jerusalem` is the single timezone constant referenced by
`lib/opening-hours/timezone.ts`/`config.ts`/`status.ts`,
`lib/promotions/filter.ts`, and `lib/analytics/timezone.ts`. These are real
functions exercised by real Node ICU/`Intl` timezone data in the 646 passing
unit tests (§12) — not a mocked timezone library. What remains unverified:
live behavior through a running server at a real wall-clock moment —
cascades from §14.

## 26. Docker build — GATE O: **BLOCKED (infrastructure)**

```
$ docker build -t maayan2000-store-locator:gate .
ERROR: failed to do request: Head "https://registry-1.docker.io/v2/library/node/manifests/22-slim": Forbidden
```

Docker's own daemon (29.4.3) was started successfully this session (nested
container, cgroup v1) — the failure is not a Docker capability problem, it's
the identical organizational egress policy. Additionally probed this session
(read-only `HEAD` requests, no pull attempted) to characterize the block's
scope precisely: `ghcr.io`, `mcr.microsoft.com`, and `gcr.io` **all** return
the identical `403`/`connect_rejected` — this is a blanket container-registry
block, not a Docker-Hub-specific one, so no alternate base-image registry
would resolve it from within this sandbox.

## 27. Docker runtime — GATE P

Not attempted — no image was produced (§26).

## 28. CI workflow result — GATE Q

`.github/workflows/ci.yml` (authored in Phase 11) was re-inspected, not
redesigned — confirmed syntactically valid YAML (parsed successfully),
two jobs present exactly as documented: `build-and-test` (install → `prisma
generate` → lint → typecheck → Vitest → build) and `e2e` (Postgres service
container → `prisma generate` → `migrate deploy` → `db seed` → Chromium
install → build → `next start` via `E2E_START_SERVER=1` → the three
permanent Playwright specs → report upload). **It could not be executed this
session**: this sandbox has no `gh` CLI, no configured git remote, and no CI
credentials — there is no authorized runner reachable from here. This is the
literal remaining step: push this repository to a GitHub repo with Actions
enabled (or an equivalent CI system with normal internet egress), and this
workflow is what closes Gates B, D–N, and the E2E half of Q in one real run.

## 29. Security/secrets check — GATE R

- No `.env*` file (other than `.env.example`) is tracked by git (`git
  ls-files` confirmed empty for that pattern).
- `.gitignore` explicitly excludes `.env*` (line 44).
- No committed file contains a literal `AUTH_SECRET=<value>`.
- A broad pattern search for hardcoded passwords/API keys/secrets across
  tracked source files returned nothing beyond validator field names and
  `process.env.*` references.
- `.github/workflows/ci.yml`'s embedded `DATABASE_URL`/`AUTH_SECRET` values
  are disposable, clearly-labeled CI-only placeholders
  (`ci-placeholder-secret-not-for-production-use-only`, a service-container
  Postgres credential scoped to that job's ephemeral runner) — not real
  secrets, and never usable outside that job.
- `prisma/seed.ts` explicitly refuses to create the DEMO admin accounts when
  `NODE_ENV === "production"` (verified in source) — no insecure production
  credential can be created by the documented seed command.
- No test in the suite targets a production database; all 646 tests mock
  `@/lib/prisma` at the module boundary.

**No secrets/security issue found.**

## 30. Bugs discovered

**None.** Every gate that could not complete traces to exactly one root
cause (organizational egress policy blocking `binaries.prisma.sh` and all
external container registries), confirmed with direct evidence at each
gate rather than assumed. No gate surfaced an application-level defect this
session. Two small, real documentation gaps were found and closed (not code
defects, and not "product functionality" — the deployment runbook's own
DEFECT POLICY-adjacent completeness): the deploy runbook did not previously
spell out "backup immediately before `migrate deploy`" as an explicit
numbered step, and did not explicitly name `prisma migrate reset`/`migrate
dev` as forbidden against production. Both fixed directly in
`docs/production-deployment.md` §5.

## 31. Bugs fixed

None (no application defect was found — see §30). The two documentation
completeness gaps above were closed.

## 32. Remaining blockers

Identical in substance to the five Phase 11 blockers — now confirmed with
sharper, freshly-gathered evidence rather than carried forward by assumption:

1. `prisma generate` has never completed successfully anywhere.
2. The application has never started against real PostgreSQL with a real
   generated client.
3. `prisma migrate deploy` and `prisma db seed` have never been executed
   successfully through the actual Prisma CLI (only raw SQL against the
   migration files' own statements, which this gate correctly does not
   accept as equivalent).
4. The three permanent Playwright suites have never executed.
5. `docker build` has never completed — now additionally confirmed to be
   blocked by a blanket container-registry policy, not merely a Docker Hub
   quirk.

All five have one single root cause (§3, §26) and one single remaining
remedy: run `.github/workflows/ci.yml` (or an equivalent) on a runner with
normal internet egress — a GitHub Actions runner on this repository once
pushed to GitHub, or any other CI system without this sandbox's egress
policy. Nothing else in this codebase needs to change first.

## 33. Non-blocking improvements

Unchanged from the Phase 11 report (`PHASE_11_RAPPORT.md` §8): CSP left
uncalibrated until the app can be opened live, HSTS to be set at the
TLS-terminating proxy rather than in application code, no rate limiting on
`/admin/login` (would require a shared store the app deliberately doesn't
have), 5 transitive `npm audit` advisories not exploitable in this app's
actual usage (breaking-change-only fixes, correctly not applied), logs not
yet structured (`pino` suggested if volume ever justifies it), no image
storage domain chosen yet.

---

## Final verdict

# `NOT PRODUCTION READY`

### BLOCKERS

The five items in §32. Every one of them is an infrastructure/validation gap
in *this development sandbox*, not a known defect in the application, the
schema, the migrations, the concurrency mechanism, or the tests — but per
this gate's own explicit rule, `PRODUCTION READY` may only be declared once
they are closed by **real execution**, and none of them were closed by real
execution this session (each was genuinely attempted and precisely proven
blocked, never assumed).

### What must happen to change the verdict

Run `.github/workflows/ci.yml` — unmodified, or adjusted only if it itself
reveals a real defect — on a runner with normal internet access:

1. Push this repository to a GitHub repository with Actions enabled (or
   provide equivalent CI/CD with unrestricted egress).
2. Let the `build-and-test` job run for real: clean install → `prisma
   generate` → lint → `tsc --noEmit` → Vitest → `next build`. All five must
   succeed with the exact same numbers reported here (646/646, 0 lint
   errors) plus, newly, 0 TypeScript errors and a completed build.
3. Let the `e2e` job run for real: Postgres service container → `prisma
   migrate deploy` → `prisma db seed` → `next build` → `next start` →
   Playwright's three permanent suites, all green.
4. Separately, run `docker build .` on a machine/runner with normal registry
   access, then run the resulting container against an isolated PostgreSQL
   and repeat the `/api/health` + smoke-test check from Gate I/P.
5. Bring the results of 2–4 back as the Production Gate re-run; if every
   number matches (or exceeds, for tests) what this report and Phase 11
   already established at the code level, the verdict becomes
   `PRODUCTION READY` at that point — not before.

### NON-BLOCKING IMPROVEMENTS

The items in §33 — none prevent a first production deployment, all are
worth scheduling afterward.

---

*End of DSM Production Gate report. No Phase 12 work was started. Waiting
explicitly for "Start Phase 12."*

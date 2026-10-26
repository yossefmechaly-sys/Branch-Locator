# Phase 11 — Production Hardening, Real Database Validation & Deployment Readiness — Rapport final

Ce rapport couvre l'intégralité de la Phase 11 : audits fondés sur preuves
(sécurité/RBAC/auth, performance/requêtes DB/index, SEO/accessibilité,
observabilité/error-boundaries), le durcissement de la concurrence optimiste
en deux étapes (garde atomique au niveau transaction, puis migration du
mécanisme de concurrence vers une colonne `version` entière explicite au
niveau schéma/requête SQL), l'audit du reste du code admin pour le même
défaut TOCTOU, et l'ensemble de la checklist de préparation au déploiement
(environnement, architecture, Docker, CI, runbook, rollback, sauvegarde,
observabilité). Voir `docs/production-deployment.md` pour le détail
opérationnel complet référencé tout au long de ce rapport.

**À lire en premier, comme pour chaque phase précédente** : l'environnement de
développement utilisé pour cette phase a un `prisma generate` bloqué par une
politique d'égress réseau organisationnelle délibérée (`binaries.prisma.sh`,
`403 Forbidden`) et aucune instance PostgreSQL locale démarrée — voir §14 de
`PHASE_9_RAPPORT.md` pour l'investigation originale, revérifiée à l'identique
cette phase (§9 ci-dessous), jamais contournée. Cette même politique bloque
également `registry-1.docker.io` (Docker Hub), découvert cette phase en
tentant de valider le nouveau `Dockerfile` (§6). Toute la couche touchant
`prisma` reste donc vérifiée par relecture, typage TypeScript strict, tests
unitaires avec `prisma` intégralement mocké, et — nouveau cette phase — par
application directe de SQL brut via `psql` contre de vraies bases PostgreSQL
locales pour valider les migrations indépendamment du client Prisma généré.
**Jamais exécutée contre l'application réellement démarrée dans cet
environnement.**

---

## 1. Vue d'ensemble

Trois blocs de travail composent cette phase :

1. **Durcissement de la concurrence optimiste** (le cœur technique de cette
   phase, sur demande explicite en cours de route) : remplacement complet
   d'un verrou basé sur `updatedAt` (comparé côté application, TOCTOU
   possible) par une colonne `version Int @default(1)` explicite sur `City`,
   `Branch`, `Service`, `Promotion`, avec une garde atomique
   `WHERE id = ? AND version = expectedVersion` + `version: { increment: 1 }`
   dans la MÊME requête `UPDATE`, comme première opération de chaque
   transaction Prisma — avant toute suppression/recréation de relation
   enfant. Voir §3-§4.
2. **Audits fondés sur preuves + correctifs ciblés** : sécurité/RBAC/auth,
   performance/requêtes/index, SEO/accessibilité, observabilité — chaque
   défaut réel trouvé a été corrigé de façon étroite, aucun changement
   spéculatif. Voir §5.
3. **Checklist de préparation au déploiement** : environnement, architecture,
   `Dockerfile`, CI GitHub Actions, runbook, rollback, sauvegarde/restauration,
   observabilité — documentés intégralement dans `docs/production-deployment.md`
   et résumés §6-§8 ci-dessous.

---

## 2. Fichiers créés et modifiés (Phase 11)

### 2.1 Concurrence optimiste — schéma et migrations

`prisma/schema.prisma` (colonnes `version Int @default(1)` sur `City`,
`Branch`, `Service`, `Promotion` ; `Service.updatedAt` ajouté — défaut de
schéma préexistant découvert pendant cette phase, voir §3.3),
`prisma/migrations/20260901020000_service_updated_at/migration.sql`,
`prisma/migrations/20260901030000_optimistic_lock_version/migration.sql`,
`prisma/migrations/20260901010000_promotion_branch_index/migration.sql`
(index manquant, voir §5.2).

### 2.2 Concurrence optimiste — couche service et Server Actions

`services/admin/{branch,promotion,service,city}-admin.service.ts` (verrou
atomique `updateMany` + incrément `version` dans la transaction),
`app/admin/(dashboard)/{branches,promotions,services,cities}/actions.ts`
(signature `expectedVersion: number`), `app/admin/(dashboard)/{branches,
promotions,services,cities}/[id]/edit/page.tsx` (`initialVersion` transmis au
formulaire), `components/admin/{BranchForm,PromotionForm,ServiceForm,
CityForm}.tsx` (prop `initialVersion`, jamais affiché ni éditable — voyage
comme valeur interne uniquement).

### 2.3 Concurrence optimiste — tests

`tests/unit/admin-promotion-service.test.ts` (matrice complète réécrite en
`version`, incluant la simulation deux-clients TOCTOU),
`tests/unit/admin-transaction-audit.test.ts` (même conversion pour
magasins/services/villes, 3 nouveaux tests d'incrément atomique + 3 nouvelles
simulations deux-clients), `tests/unit/admin-promotion-actions-security.test.ts`
(signature corrigée + assertion « pas d'audit de succès sur conflit »).

### 2.4 Audits Phase 11 — correctifs de sécurité/session/accessibilité/SEO/observabilité

`next.config.ts` (`poweredByHeader: false`, en-têtes de sécurité, puis cette
session : `output: "standalone"`), `lib/auth/config.ts` (`session.maxAge`/
`updateAge` explicites), `app/[locale]/error.tsx`, `app/admin/error.tsx`,
`app/global-error.tsx`, `app/api/health/route.ts` (nouveaux), `components/admin/
{BranchForm,PromotionForm,CityForm,ServiceForm}.tsx` (association `htmlFor`/`id`),
`lib/seo/branch-urls.ts` (`buildLocaleHreflangAlternates`),
`app/[locale]/branches/page.tsx`, `app/sitemap.ts` (hreflang cohérent),
`messages/{he,en,fr,ru,es}.json` (clé `errorBoundary`).

### 2.5 Checklist de déploiement (ce segment de session)

`docs/production-deployment.md` (nouveau — checklist d'environnement,
architecture, Docker, CI, runbook, rollback, sauvegarde/restauration,
observabilité, sécurité), `Dockerfile`, `.dockerignore` (nouveaux),
`.github/workflows/ci.yml` (nouveau — deux jobs : build/lint/typecheck/tests,
et E2E Playwright réel contre PostgreSQL de service).

---

## 3. Durcissement de la concurrence optimiste — détail technique

### 3.1 Étape 1 : fermeture de la fenêtre TOCTOU (garde atomique en transaction)

Le mécanisme initial (`updatedAt` lu, comparé, puis écrit plus tard) avait une
fenêtre de concurrence classique entre la comparaison et l'écriture. Corrigé
en remplaçant la comparaison hors-transaction par une écriture conditionnelle
ATOMIQUE, PREMIÈRE opération de chaque transaction :

```ts
await prisma.$transaction(async (tx) => {
  const guarded = await tx.branch.updateMany({
    where: { id, version: expectedVersion },
    data: { version: { increment: 1 }, updatedAt: now },
  });
  if (guarded.count === 0) throw new AdminConflictError(/* ... */);
  // — à partir d'ici seulement : purge + recréation des relations enfant,
  //   toutes dans le même `tx`, jamais avant que la garde n'ait réussi.
});
```

Postgres pose un verrou ligne réel dès cet `UPDATE` ; une transaction
concurrente touchant la même ligne attend le commit/rollback de celle-ci avant
de réévaluer sa propre clause `WHERE version = ...`, qui ne correspond alors
plus. Comparaison et écriture sont ainsi une seule opération atomique, jamais
deux étapes séparables — la pré-vérification hors-transaction qui reste dans
le code n'est plus qu'un raccourci UX (échec rapide, message clair pour le cas
« id inexistant »), jamais la source de vérité.

### 3.2 Étape 2 : pivot vers une colonne `version` entière (sur demande explicite)

Après un premier passage sur `updatedAt`, l'utilisateur a demandé
explicitement de re-évaluer la fiabilité d'une comparaison `updatedAt` dans un
`WHERE` (précision Prisma/Postgres, égalité de type `DateTime`) et a exprimé
une préférence explicite pour un entier `version` si cela améliore
matériellement la correction. Décision retenue : **`version` devient l'UNIQUE
source de vérité pour la concurrence** ; `updatedAt` est conservé mais
rétrogradé au rang de champ d'affichage uniquement, plus jamais comparé dans
un `WHERE`. Les deux mécanismes ne sont jamais compétitifs — documenté
explicitement dans le schéma (voir le commentaire long sur `Branch.version`,
la référence canonique reprise par les trois autres modèles).

L'incrément est TOUJOURS l'opérateur atomique Prisma `{ increment: 1 }`,
jamais une valeur calculée côté JavaScript (`expectedVersion + 1`), ce qui
réintroduirait exactement la même race. Vérifié explicitement par un test
dédié par domaine (`admin-promotion-service.test.ts`,
`admin-transaction-audit.test.ts` — assertion sur l'appel `updateMany` exact).

### 3.3 Défaut de schéma réel découvert pendant l'investigation

En traçant comment `updatedAt` interagissait entre la garde et l'écriture
finale, un défaut préexistant a été découvert : **le modèle `Service` n'avait
jamais eu de colonne `updatedAt`** en base réelle (`\d services` sur
PostgreSQL confirmé), alors que `service-admin.service.ts` lisait/comparait
`existing.updatedAt` depuis la Phase 9 — invisible à `tsc` uniquement parce
que les types `@prisma/client` ne peuvent pas être générés dans ce bac à
sable. Corrigé par migration additive
(`20260901020000_service_updated_at`), appliquée et vérifiée contre les trois
bases PostgreSQL réelles de ce bac à sable.

### 3.4 Migration `version` — garanties et vérification

`prisma/migrations/20260901030000_optimistic_lock_version/migration.sql` —
`ALTER TABLE ... ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1` sur les
quatre tables. Additive, non destructive, aucune recréation de table,
initialisation déterministe des lignes existantes (`version = 1`).

Vérifiée de trois façons indépendantes, contre de vraies bases PostgreSQL
locales (créées puis supprimées après vérification, jamais sur une base
partagée) :

- contre une base jetable **seedée avec des lignes représentatives simulant
  une base Phase 10 existante** (SQL brut, avant l'ajout de la colonne) : les
  quatre lignes obtiennent bien `version = 1` de façon déterministe après
  migration ;
- contre une chaîne complète de 7 migrations sur une base fraîche
  (base vide → toutes les migrations dans l'ordre) ;
- appliquée aux trois bases persistantes réelles de ce bac à sable
  (`maayan2000`, `maayan2000_clean`, `maayan2000_test`).

### 3.5 Audit TOCTOU du reste du code admin

Chaque `findUnique`/`findFirst` du code applicatif (hors tests) a été
réexaminé. En dehors des quatre services déjà corrigés : `getBranchBySlug`
(`branch.repository.prisma.ts`) est une lecture publique pure, jamais suivie
d'une écriture ; `touchLastLogin` (`admin-user.repository.prisma.ts`) est une
écriture aveugle d'un seul champ (horodatage de connexion), sans étape de
comparaison préalable. **Aucune autre occurrence du motif TOCTOU trouvée.**

### 3.6 Quels autres modèles ont besoin de `version` ? (audit explicitement demandé)

| Modèle | Verrou `version` ? | Justification |
|---|---|---|
| `City`, `Branch`, `Service`, `Promotion` | **Oui (déjà fait)** | Seuls modèles avec un formulaire admin d'édition concurrente et un flux lire-comparer-écrire. |
| `BranchTranslation`, `PromotionTranslation`, `ServiceTranslation`, `CityTranslation`, `BranchOpeningHours`, `SpecialOpeningHours`, `BranchService`, `BranchImage`, `SearchAlias`, `PromotionBranch` | Non | Tables enfant/de jonction, toujours purgées-et-recréées intégralement sous le verrou `version` de leur PARENT, dans la même transaction — aucun flux d'édition indépendant, un verrou dédié serait mort-code. |
| `AdminUser` | Non | A bien `@updatedAt`, mais sa seule écriture (`touchLastLogin`) est aveugle, sans étape de comparaison — aucun risque de concurrence à protéger. |
| `AuditLog`, `AnalyticsEvent` | Non | Tables d'ajout seul (append-only), jamais mises à jour après création. |

Conformément à la consigne explicite (« ne pas ajouter de colonne `version`
partout sans discernement »), aucune colonne supplémentaire n'a été ajoutée.

### 3.7 Comportement de création préservé

Aucune des quatre fonctions `createX` ne référence `version` dans son
`data` — repose entièrement sur `@default(1)` du schéma (vérifié §3.4) :
« nouvelle entité = version 1 » est garanti au niveau base, jamais recalculé
côté application.

---

## 4. Résultat des tests de concurrence

- **Matrice complète par domaine** (magasin/promotion/service/ville) :
  commit réussi, rollback après échec de suppression enfant, rollback pendant
  la recréation finale, conflit de concurrence empêche TOUTE écriture
  partielle, relations non affectées restent scopées au seul enregistrement
  ciblé, aucune invalidation de cache/audit de succès sur rollback ou conflit.
- **Simulation deux-clients (A/B), les quatre domaines** : A et B chargent
  tous deux la version T1 ; A réussit en premier (T1→T2) ; B soumet ENCORE
  T1 ; le mock de pré-vérification de B renvoie délibérément la même version
  périmée que celle vue par A (isolant ainsi la garde ATOMIQUE, pas la simple
  pré-vérification, comme mécanisme réellement testé) ; B reçoit
  `AdminConflictError` ; **aucune** relation enfant de B n'est
  supprimée/modifiée.
- **646/646 tests Vitest passent** (81 fichiers), suite complète du projet,
  aucune régression.

---

## 5. Audits Phase 11 — sécurité/RBAC/auth, performance, SEO/accessibilité, observabilité

(Correctifs déjà livrés en amont de ce segment de session — résumés ici pour
que ce rapport soit une référence complète et autonome de la phase.)

### 5.1 Sécurité / RBAC / auth

- En-têtes de sécurité globaux (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`), retrait de `X-Powered-By`.
- Durée de session admin explicite (12h, renouvelée toutes les heures
  d'activité) — remplace le défaut Auth.js de 30 jours, trop long pour un
  back-office.
- RBAC déjà vérifié systématiquement dans chaque Server Action
  (`requireMutationPermission()`), jamais seulement au niveau du Proxy —
  conforme à l'avertissement officiel Next.js 16 (cité dans `proxy.ts`).

### 5.2 Performance / requêtes DB / index

- Index manquant détecté et corrigé sur `PromotionBranch.branchId` — chemin
  de lecture public le plus chaud (`loadPromotionsForBranches()`), migration
  `20260901010000_promotion_branch_index`, vérifiée sur les trois bases
  réelles.

### 5.3 SEO / accessibilité

- Divergence hreflang détectée entre le mécanisme automatique (`Link` header
  du proxy next-intl) et le mécanisme explicite (`<link>` de métadonnées) pour
  la page d'accueil du Store Locator — corrigée via
  `buildLocaleHreflangAlternates()`, appliquée à `app/[locale]/branches/page.tsx`
  et `app/sitemap.ts`.
- Association `label`/`input` manquante (`htmlFor`/`id`) sur plusieurs champs
  des quatre formulaires admin — corrigée (composant `Field` partagé via
  `useId()`/`cloneElement` pour `BranchForm`/`PromotionForm` ; paires
  manuelles pour `CityForm`/`ServiceForm`).

### 5.4 Observabilité / error boundaries

- Trois niveaux d'`error.tsx` ajoutés (`app/[locale]/error.tsx` localisé,
  `app/admin/error.tsx` non localisé cohérent avec le reste de l'admin,
  `app/global-error.tsx` filet de sécurité racine sans dépendance à aucun
  provider).
- `/api/health` : `SELECT 1` réel contre PostgreSQL, jamais un `200` statique
  ; ne fuite jamais le détail d'erreur au client, uniquement en
  `console.error` serveur.

### 5.5 Audit complémentaire de cette session — aucun nouveau défaut bloquant

Un balayage ciblé (en-têtes, `npm audit`, absence de limitation de débit sur
`/admin/login`, attributs `alt` manquants) n'a trouvé **aucun nouveau défaut
bloquant** — deux points documentés comme suivis non bloquants, voir §8.

---

## 6. Checklist de déploiement — résumé (détail complet : `docs/production-deployment.md`)

- **Environnement** : Node ≥20.9 (recommandé 22 LTS), PostgreSQL 14+
  (recommandé 16), 6 variables d'environnement obligatoires documentées avec
  leur rôle exact et leur sensibilité.
- **Architecture** : hébergement autogéré (déjà un choix du code —
  `trustHost: true`, jamais Vercel), reverse proxy/CDN pour TLS+HSTS,
  conteneur(s) Next.js sans état (sessions JWT), une seule base PostgreSQL
  managée avec sauvegardes automatiques, migrations comme étape de
  déploiement distincte (jamais au démarrage de l'app).
- **Runbook** : premier déploiement (base vide) et déploiements suivants
  (mise à jour), avec vérification `/api/health` avant tout routage de trafic
  réel dans les deux cas.
- **Rollback** : applicatif trivial (sans état serveur) ; schéma toujours par
  migration corrective forward-only (jamais de `down` destructif exécuté),
  cohérent avec la nature additive de toutes les migrations de ce projet ;
  interdiction explicite de tester un rollback destructif sur une base
  partagée, respectée.
- **Sauvegarde/restauration** : `pg_dump` planifié + snapshots natifs de la
  plateforme si base managée ; procédure de restauration documentée,
  distinguée explicitement du rollback applicatif.
- **Observabilité** : health check + error boundaries déjà en place (§5.4) ;
  limite connue documentée (logs non structurés, recommandation `pino` en
  suivi non bloquant).

---

## 7. Docker et CI — ce qui a pu être validé ici, et ce qui ne l'a pas pu

### 7.1 Dockerfile

Build multi-étapes standard (`deps` → `builder` → `runner`), utilisateur
non-root, `output: "standalone"` activé dans `next.config.ts` pour cette
phase. **`docker build .` a été tenté dans ce bac à sable** (Docker 29.4.3
présent, démon démarré avec succès malgré l'environnement conteneurisé
imbriqué) mais échoue **avant même** d'atteindre `prisma generate`, dès le
`docker pull` implicite de l'image de base :

```
ERROR: failed to do request: Head "https://registry-1.docker.io/v2/library/node/manifests/22-slim": Forbidden
```

Confirmé par inspection des variables d'environnement du bac à sable : la
même politique d'égress organisationnelle qui bloque `binaries.prisma.sh`
(liste blanche explicite de domaines pour un proxy sortant — `npm`/`pypi`/
`Go`/`crates.io` y figurent, ni Docker Hub ni `binaries.prisma.sh`). Aucun
miroir alternatif ni option `--insecure-registry` tenté. **Le `Dockerfile`
n'a donc pas pu être validé de bout en bout ici** — relu attentivement, mais
reste dans la catégorie « à vérifier dans un environnement réel ».

### 7.2 CI GitHub Actions

`.github/workflows/ci.yml` — deux jobs actifs (pas des squelettes commentés) :

1. `build-and-test` : `npm ci` → `prisma generate` → lint → `tsc --noEmit` →
   Vitest → `next build`, sur un runner avec un accès réseau normal.
2. `e2e` : service PostgreSQL réel → `prisma generate` → `migrate deploy` →
   `db seed` → installation Chromium → `next build` → `next start` (via
   `E2E_START_SERVER=1`) → suite Playwright **permanente**
   (`admin-full-journey`, `admin-analytics-journey`, `admin-import-journey`).

Ce workflow n'a **pas pu être exécuté** dans ce bac à sable (pas de runner
GitHub Actions disponible ici) — c'est précisément lui qui doit devenir, dans
le dépôt réel, la première exécution de bout en bout réussie de
`prisma generate`/`next build`/la suite Playwright que ce projet ait jamais
eue.

---

## 8. Améliorations non bloquantes (suivi recommandé, pas fait cette phase)

Aucun de ces points n'est un défaut confirmé bloquant la mise en production —
documentés pour arbitrage futur, volontairement non implémentés maintenant
pour rester dans le périmètre étroit demandé :

1. **`Content-Security-Policy`** absente délibérément — nécessite de calibrer
   contre l'application réellement démarrée (Google Maps, styles Tailwind),
   impossible à faire sans risque à l'aveugle dans ce bac à sable.
2. **`Strict-Transport-Security` (HSTS)** — à poser au niveau du reverse
   proxy/TLS, pas dans le code applicatif (l'app ne sait pas fiablement si
   elle est servie en HTTPS derrière un proxy interne).
3. **Aucune limitation de débit sur `/admin/login`** — une protection
   anti-brute-force correcte a besoin d'un état partagé entre instances
   (l'application étant explicitement sans état), donc d'une nouvelle
   dépendance d'infrastructure (Redis ou équivalent) — hors du périmètre
   d'un durcissement ciblé.
4. **`npm audit` : 5 vulnérabilités transitives** (`deepmerge-ts` via
   `@prisma/config`→`prisma` ; `uuid` via `exceljs`), sévérité modérée/haute
   selon le scanner mais non exploitables dans l'usage réel de ce projet
   (jamais de buffer/objet contrôlé par un utilisateur non authentifié en
   entrée de ces chemins) ; les correctifs proposés forceraient une
   rétrogradation majeure de `prisma` (7→6.12) ou `exceljs`, refusée pour ne
   pas invalider le travail de cette phase sans défaut concret prouvé.
5. **Logs non structurés** (`console.error`/`console.log`) — suffisant pour
   un déploiement conteneurisé standard (stdout/stderr déjà collectés par la
   plateforme), une bibliothèque de logs structurés (`pino`) resterait un
   suivi utile si le volume de trafic réel le justifie un jour.
6. **Domaine(s) de stockage des photos** (`images.remotePatterns`) toujours
   vide — aucun fournisseur de stockage objet choisi à ce stade (pas une
   régression : c'était déjà le cas avant cette phase, et aucune décision de
   fournisseur n'a été demandée).

---

## 9. Résultats exacts de vérification (cette session, blocs concurrence + déploiement)

| Commande | Résultat |
|---|---|
| `npx vitest run` (suite complète) | **646/646 tests passent, 81 fichiers, 0 échec.** |
| `npx tsc --noEmit` | 3 erreurs, toutes identiques au blocage Prisma connu (`lib/prisma.ts`, `prisma/seed.ts` — `PrismaClient`/`Locale` non exportés faute de génération). Aucune autre erreur. |
| `npx eslint .` | **0 erreur**, 4 avertissements préexistants sans rapport avec cette phase. |
| `npx prisma format` | Échec — `403 Forbidden` sur `binaries.prisma.sh`. |
| `npx prisma validate` | Échec — même `403 Forbidden`. |
| `npx prisma generate` | Échec — même `403 Forbidden`. |
| `npx next build` | Compile avec succès (« Compiled successfully »), échoue à l'étape `Running TypeScript` avec les 3 mêmes erreurs que `tsc --noEmit` ci-dessus (client Prisma non généré) — pas une régression applicative. |
| `docker build .` | Échec — `403 Forbidden` sur `registry-1.docker.io` (Docker Hub), avant même d'atteindre `prisma generate` dans l'image. Même politique d'égress organisationnelle. |
| `npm audit --omit=dev` | 5 vulnérabilités (2 modérées, 3 hautes), toutes transitives, voir §8.4. |

**Aucune de ces limitations n'a été contournée** (pas de
`PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING`, pas de miroir Docker alternatif,
pas de dégradation de test pour les faire passer) — conforme à la consigne
absolue de ne jamais masquer ce blocage documenté depuis la Phase 3/9.

---

## 10. Checklist Phase 11 — état final

| # | Point | État |
|---|---|---|
| 1 | Concurrence optimiste : verrou atomique en transaction (toutes mutations) | ✅ Fait et testé |
| 2 | Concurrence optimiste : colonne `version` entière au niveau schéma/SQL | ✅ Fait, migré, vérifié SQL brut |
| 3 | Migration additive, non destructive, sûre sur base existante | ✅ Vérifié (base seedée simulant Phase 10) |
| 4 | Migration vérifiée sur base fraîche (chaîne complète) | ✅ Vérifié |
| 5 | `version` jamais éditable côté client | ✅ Vérifié (jamais dans le payload Zod, jamais affiché) |
| 6 | Audit TOCTOU du reste du code admin | ✅ Fait — aucune autre occurrence |
| 7 | Audit « quels autres modèles ont besoin de `version` » | ✅ Fait — aucun autre modèle qualifié |
| 8 | Tests de régression concurrence (4 domaines × matrice complète) | ✅ 646/646 |
| 9 | Simulation deux-clients (TOCTOU fermé, pas juste la pré-vérification) | ✅ 4 domaines |
| 10 | Audit sécurité/RBAC/auth + correctifs réels | ✅ Fait (session précédente de cette phase) |
| 11 | Audit performance/requêtes/index + correctifs réels | ✅ Fait |
| 12 | Audit SEO/accessibilité + correctifs réels | ✅ Fait |
| 13 | Audit observabilité/error-boundaries + implémentation | ✅ Fait |
| 14 | Checklist environnement de production | ✅ Documentée (`docs/production-deployment.md` §1) |
| 15 | Architecture de déploiement | ✅ Documentée (§2) |
| 16 | `Dockerfile` production | ✅ Écrit — **non validé de bout en bout** (§7.1) |
| 17 | CI finalisée | ✅ Écrite (deux jobs actifs) — **jamais exécutée** (§7.2) |
| 18 | Runbook de déploiement | ✅ Documenté (§5) |
| 19 | Stratégie de rollback | ✅ Documentée (§6) |
| 20 | Sauvegarde/restauration | ✅ Documentée (§7) |
| 21 | `prisma generate` réel | ❌ **Bloqué dans ce bac à sable** |
| 22 | Démarrage réel de l'app contre PostgreSQL réel | ❌ **Jamais tenté ici (bloqué en amont par #21)** |
| 23 | `prisma migrate deploy`/`db seed` réels | ❌ **Jamais exécutés ici (migrations vérifiées en SQL brut uniquement)** |
| 24 | Suite Playwright permanente exécutée | ❌ **Jamais exécutée ici (§7.2)** |
| 25 | `docker build` validé de bout en bout | ❌ **Bloqué avant `prisma generate` (§7.1)** |

---

## 11. Verdict final

**`NOT PRODUCTION READY`**

### Bloquants (doivent être levés avant toute mise en production réelle)

- `npx prisma generate` n'a **jamais réussi** dans aucun environnement à ce
  jour — le client Prisma type-safe réellement utilisé en production n'a
  jamais existé, seulement des formes de ligne déclarées à la main comme
  substitut de développement.
- L'application n'a **jamais démarré** contre une vraie instance PostgreSQL,
  dans aucun environnement — `next start`/`next dev` contre une base réelle
  reste entièrement non vérifié.
- `prisma migrate deploy` et `prisma db seed` n'ont **jamais été exécutés**
  par la CLI Prisma elle-même — seule une application manuelle du SQL des
  fichiers de migration via `psql` a été vérifiée, ce qui valide le SQL mais
  pas le comportement de la CLI (suivi de `_prisma_migrations`, ordre
  d'exécution réel, `db seed` intégré).
- La suite Playwright **permanente** (Phase 9 §28, 3 fichiers de test) n'a
  **jamais été exécutée**, dans aucun environnement, depuis sa création.
- `docker build` n'a jamais abouti — le `Dockerfile` de cette phase reste
  non validé de bout en bout.

Ces cinq points sont exactement ceux que le workflow CI ajouté cette phase
(`.github/workflows/ci.yml`) est conçu pour lever, sur un runner avec un
accès réseau normal — **mais ce workflow lui-même n'a pas pu être exécuté
ici** pour le confirmer. Tant qu'aucune de ces cinq étapes n'a réussi dans un
environnement réel, le verdict ne peut pas être `PRODUCTION READY`, quelle
que soit la qualité du travail vérifiable par ailleurs (typage, tests
unitaires mockés, revue de code, vérification SQL indépendante).

### Non bloquant (améliorations recommandées, voir §8 pour le détail complet)

CSP absente (calibrage nécessite l'app démarrée), HSTS à poser au niveau
infrastructure, absence de limitation de débit sur la connexion admin,
5 vulnérabilités `npm audit` transitives non exploitables dans l'usage réel,
logs non structurés, domaine de stockage photo non choisi.

### Ce qui EST vérifié et peut être considéré comme fiable dès qu'un
### environnement réel confirme les 5 points bloquants ci-dessus

Toute la logique métier, la validation Zod, le RBAC, le mécanisme de
concurrence optimiste (relu, typé, testé unitairement avec 646/646 tests
passants, et vérifié en SQL brut indépendamment pour la partie migration),
les correctifs de sécurité/performance/SEO/accessibilité/observabilité de
cette phase, et l'ensemble de la documentation de déploiement — tout cela est
prêt à être confirmé, pas à être re-conçu, une fois qu'un environnement avec
un accès réseau normal peut exécuter `prisma generate` → migrer → seed →
démarrer → Playwright avec succès.

---

*Fin du rapport Phase 11. Conformément à la consigne explicite : cette phase
s'arrête ici. Pas de Phase 12 entamée — en attente de « Continue Phase 12 ».*

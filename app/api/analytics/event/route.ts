import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAnalyticsProviders } from "@/lib/analytics/providers";
import { normalizeAnalyticsEvent } from "@/lib/analytics/normalize";
import { consumeRateLimit } from "@/lib/analytics/rate-limit";
import {
  ANALYTICS_SESSION_COOKIE_NAME,
  ANALYTICS_SESSION_TTL_SECONDS,
  generateAnonymousSessionId,
  isValidSessionId,
} from "@/lib/analytics/session";
import {
  ANALYTICS_MAX_PAYLOAD_BYTES,
  analyticsIngestionBodySchema,
} from "@/lib/validators/analytics";

/**
 * `POST /api/analytics/event` (Phase 10, §6) — SEUL point d'entrée HTTP pour
 * tout événement analytics. Reçoit toujours un LOT (`{ events: [...] }`,
 * même pour un seul événement — voir `lib/analytics/track.ts`), jamais
 * `prisma` directement depuis un Client Component (§6, impératif) : cette
 * route est le seul endroit, entièrement serveur, qui touche
 * `getAnalyticsProviders()`.
 *
 * Pipeline dans l'ordre : taille du corps → JSON → Zod (rejette tout
 * événement de forme inconnue, ignore silencieusement les propriétés
 * inconnues À L'INTÉRIEUR d'un événement par ailleurs valide, §6) → limite de
 * débit (§7/§37) → normalisation (§1) → écriture via chaque fournisseur actif.
 *
 * Ne DOIT jamais faire échouer la navigation de l'appelant (§7) : répond
 * toujours vite, n'expose jamais la pile d'erreur, et une panne d'écriture
 * n'affecte que la réponse HTTP, jamais le reste du Store Locator (déjà
 * garanti côté client par `track()`, qui n'attend jamais cette réponse pour
 * continuer).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > ANALYTICS_MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  const rawBody = await request.text();
  if (rawBody.length > ANALYTICS_MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parseResult = analyticsIngestionBodySchema.safeParse(json);
  if (!parseResult.success) {
    // Corps globalement mal formé (pas un objet `{ events: [...] }`, lot vide
    // ou trop grand) — SEUL cas où tout le lot est rejeté ; un événement
    // individuellement invalide À L'INTÉRIEUR d'un lot par ailleurs valide
    // est filtré silencieusement par le schéma (union discriminée), jamais
    // remonté comme une erreur bloquante côté client.
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const cookieValue = request.cookies.get(ANALYTICS_SESSION_COOKIE_NAME)?.value;
  const sessionId = isValidSessionId(cookieValue) ? cookieValue : generateAnonymousSessionId();

  const rateLimitKey = sessionId ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const allowed = consumeRateLimit(rateLimitKey, parseResult.data.events.length);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const normalized = parseResult.data.events.map((event) => normalizeAnalyticsEvent(event, sessionId));

  try {
    // `Promise.allSettled` (pas `Promise.all`) — voir `providers/index.ts` :
    // la panne d'UN fournisseur ne doit jamais empêcher les autres d'écrire.
    const results = await Promise.allSettled(
      getAnalyticsProviders().map((provider) => provider.recordEvents(normalized))
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[POST /api/analytics/event] fournisseur en échec", result.reason);
      }
    }
  } catch (error) {
    // Filet de sécurité supplémentaire — ne devrait jamais être atteint
    // puisque `Promise.allSettled` ne rejette pas, mais §7 est un impératif :
    // cette route ne doit JAMAIS renvoyer une erreur qui casserait un appelant.
    console.error("[POST /api/analytics/event]", error);
  }

  const response = NextResponse.json({ accepted: normalized.length }, { status: 202 });
  response.cookies.set({
    name: ANALYTICS_SESSION_COOKIE_NAME,
    value: sessionId,
    maxAge: ANALYTICS_SESSION_TTL_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

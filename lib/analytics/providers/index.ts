import { postgresAnalyticsProvider } from "./postgres.provider";
import type { AnalyticsProvider } from "./types";

export type { AnalyticsProvider } from "./types";
export type { NormalizedAnalyticsEvent } from "@/lib/analytics/normalize";

/**
 * Registre des fournisseurs actifs (Phase 10, §1) — PostgreSQL uniquement
 * pour cette phase, EN TABLEAU pour que brancher un second fournisseur en
 * parallèle (ex. Google Analytics en plus, jamais à la place) plus tard ne
 * demande de toucher QUE cette liste, jamais la route d'ingestion elle-même
 * (`app/api/analytics/event/route.ts`).
 *
 * Une panne d'UN fournisseur (ex. un futur appel réseau vers Matomo qui
 * échoue) ne doit jamais faire échouer les autres — voir l'appel
 * `Promise.allSettled` dans la route d'ingestion plutôt qu'ici, pour garder
 * cette fonction simple et synchrone à lire.
 */
export function getAnalyticsProviders(): readonly AnalyticsProvider[] {
  return [postgresAnalyticsProvider];
}

import type { NormalizedAnalyticsEvent } from "@/lib/analytics/normalize";

/**
 * Abstraction fournisseur analytics (Phase 10, §1) — LE seul point que
 * `app/api/analytics/event/route.ts` (ingestion) connaît. PostgreSQL
 * (`postgres.provider.ts`) est le fournisseur PRINCIPAL de cette phase et le
 * seul réellement implémenté ; brancher demain Google Analytics, Matomo,
 * Mixpanel ou Segment en plus (jamais à la place, voir la note ci-dessous)
 * consiste à écrire une nouvelle classe qui implémente cette même interface
 * et à l'ajouter à `getAnalyticsProviders()` — jamais retoucher la route
 * d'ingestion, `track()`, ou les composants appelants.
 *
 * Volontairement minimal : une seule méthode. Pas de méthode de lecture ici
 * — l'agrégation/lecture (tableau de bord admin) est un besoin propre à
 * PostgreSQL (source de vérité de cette phase, §1) et vit dans
 * `services/admin/analytics.service.ts`, jamais dans cette interface
 * d'écriture générique (un fournisseur externe comme GA ne serait de toute
 * façon interrogeable qu'à travers sa PROPRE API de reporting, pas via ce
 * contrat).
 */
export interface AnalyticsProvider {
  /** Nom court, uniquement pour les logs/diagnostics. */
  readonly name: string;
  recordEvents(events: readonly NormalizedAnalyticsEvent[]): Promise<void>;
}

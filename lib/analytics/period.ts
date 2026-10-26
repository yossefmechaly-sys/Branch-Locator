import { addIsoDays } from "@/lib/analytics/timezone";

/**
 * Résolution des filtres de PÉRIODE du tableau de bord admin (Phase 10,
 * §10) — fonction pure, séparée de `lib/analytics/timezone.ts` (qui reste
 * générique, sans notion d'UI) et de `services/admin/analytics.service.ts`
 * (qui ne connaît que des dates déjà résolues). Prend un jour de référence
 * ("aujourd'hui" en heure de Jérusalem, jamais `new Date()` interprété en
 * UTC — §18) et un choix de période, renvoie une plage INCLUSIVE prête pour
 * `AnalyticsFilters`.
 */

export type AnalyticsPeriodKey = "today" | "7d" | "30d" | "custom";

export const ANALYTICS_PERIOD_KEYS: readonly AnalyticsPeriodKey[] = ["today", "7d", "30d", "custom"];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Un "YYYY-MM-DD" syntaxiquement valide — ne vérifie pas qu'il s'agit d'un
 * jour calendaire réel (ex. "2026-02-30" passe ce test), suffisant ici car
 * toute date est ensuite reconstruite via `Date.UTC` (§18), qui « déborde »
 * proprement plutôt que de produire une valeur absurde silencieuse. */
export function isValidIsoDateString(value: string | undefined | null): value is string {
  return typeof value === "string" && ISO_DATE_PATTERN.test(value);
}

export function parsePeriodKey(value: string | undefined | null): AnalyticsPeriodKey {
  return value === "today" || value === "7d" || value === "30d" || value === "custom" ? value : "7d";
}

/**
 * Résout une période nommée en plage `[startDate, endDate]` inclusive.
 * `custom` retombe sur les 7 derniers jours si les bornes fournies sont
 * absentes/invalides (jamais une plage vide ou une exception — §10 : filtre
 * toujours utilisable) et échange les bornes si `start` est postérieur à
 * `end` plutôt que de renvoyer une plage à l'envers.
 */
export function resolvePeriodRange(
  period: AnalyticsPeriodKey,
  todayIsoDate: string,
  custom?: { start?: string | null; end?: string | null }
): { startDate: string; endDate: string } {
  switch (period) {
    case "today":
      return { startDate: todayIsoDate, endDate: todayIsoDate };
    case "7d":
      return { startDate: addIsoDays(todayIsoDate, -6), endDate: todayIsoDate };
    case "30d":
      return { startDate: addIsoDays(todayIsoDate, -29), endDate: todayIsoDate };
    case "custom": {
      const fallbackStart = addIsoDays(todayIsoDate, -6);
      const start = isValidIsoDateString(custom?.start) ? custom!.start : fallbackStart;
      const end = isValidIsoDateString(custom?.end) ? custom!.end : todayIsoDate;
      return start <= end ? { startDate: start, endDate: end } : { startDate: end, endDate: start };
    }
    default: {
      const exhaustive: never = period;
      throw new Error(`Période inconnue : ${JSON.stringify(exhaustive)}`);
    }
  }
}

import { addIsoDays, jerusalemIsoDate } from "@/lib/analytics/timezone";
import type { AnalyticsConversion, AnalyticsKpis, DailySeriesPoint } from "@/types/analytics";
import { ANALYTICS_KPI_KEYS } from "@/types/analytics";

/**
 * Agrégation PURE (Phase 10, §8) — aucune de ces fonctions ne touche `prisma`
 * ni le réseau, testables isolément (`tests/unit/analytics-queries.test.ts`).
 * `services/admin/analytics.repository.ts` fait le SQL (via `groupBy`/
 * `count`, jamais du JS sur des millions de lignes brutes quand `groupBy`
 * suffit) ; `services/admin/analytics.service.ts` orchestre les deux.
 */

/** Enum Prisma `AnalyticsEventType` — chaînes, jamais le type généré
 * `@prisma/client` (indisponible dans ce bac à sable, voir le rapport Phase
 * 9 §14). Miroir de `lib/analytics/normalize.ts#EVENT_NAME_TO_DB_TYPE`. */
export type DbEventType =
  | "LOCATOR_VIEW"
  | "SEARCH"
  | "FILTER_USED"
  | "BRANCH_VIEW"
  | "BRANCH_CARD_CLICK"
  | "MAP_MARKER_CLICK"
  | "GEOLOCATION_USED"
  | "WAZE_CLICK"
  | "GOOGLE_MAPS_CLICK"
  | "APPLE_MAPS_CLICK"
  | "PHONE_CLICK"
  | "WHATSAPP_CLICK"
  | "PROMOTION_VIEW"
  | "PROMOTION_CLICK"
  | "LANGUAGE_CHANGED";

export function emptyKpis(): AnalyticsKpis {
  return Object.fromEntries(ANALYTICS_KPI_KEYS.map((key) => [key, 0])) as unknown as AnalyticsKpis;
}

/** Construit les KPI à partir d'un comptage par type déjà agrégé côté SQL
 * (`groupBy(['type'])`) — jamais recalculé en itérant des lignes brutes. Le
 * compte de recherches "zéro résultat" est fourni séparément (dérivé de
 * `metadata.matchType`, une requête `count()` filtrée dédiée — voir le
 * repository, JSON non "groupable" nativement par Prisma). */
export function kpisFromTypeCounts(
  counts: Partial<Record<DbEventType, number>>,
  zeroResultSearchCount: number
): AnalyticsKpis {
  const c = (type: DbEventType) => counts[type] ?? 0;
  const wazeClicks = c("WAZE_CLICK");
  const googleMapsClicks = c("GOOGLE_MAPS_CLICK");
  const appleMapsClicks = c("APPLE_MAPS_CLICK");
  const phoneClicks = c("PHONE_CLICK");
  const whatsappClicks = c("WHATSAPP_CLICK");
  const navigationClicks = wazeClicks + googleMapsClicks + appleMapsClicks;

  return {
    locatorViews: c("LOCATOR_VIEW"),
    branchViews: c("BRANCH_VIEW"),
    searches: c("SEARCH"),
    zeroResultSearches: zeroResultSearchCount,
    geolocationUsed: c("GEOLOCATION_USED"),
    navigationClicks,
    wazeClicks,
    googleMapsClicks,
    appleMapsClicks,
    phoneClicks,
    whatsappClicks,
    promotionViews: c("PROMOTION_VIEW"),
    promotionClicks: c("PROMOTION_CLICK"),
    visitIntent: computeVisitIntent(navigationClicks, phoneClicks, whatsappClicks),
  };
}

/**
 * "Intentions de visite" (§11/§20) — définition CENTRALISÉE ici, jamais
 * redéfinie ailleurs : navigation (Waze + Google Maps + Apple Maps) +
 * téléphone + WhatsApp. Volontairement une SOMME de clics, pas un compte de
 * visiteurs/sessions uniques : deux clics distincts (ex. téléphone PUIS
 * WhatsApp) lors d'une même visite sont deux intentions réelles et
 * distinctes, chacune légitimement comptée — ce n'est donc jamais un "double
 * comptage incohérent" (§11) tant que l'intitulé reste "intentions de
 * visite" et non "visiteurs ayant montré une intention" (une métrique
 * différente, non demandée cette phase).
 */
export function computeVisitIntent(navigationClicks: number, phoneClicks: number, whatsappClicks: number): number {
  return navigationClicks + phoneClicks + whatsappClicks;
}

/** `null` si le dénominateur est nul (§17 : jamais une division par zéro
 * silencieuse ni un `Infinity`/`NaN` affiché). */
function safeRatio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

/** Ratios de conversion (§12) — toujours "interaction"/"intention de
 * visite"/"engagement" dans les libellés UI, jamais "vente"/"chiffre
 * d'affaires" (§12, impératif). */
export function computeConversion(kpis: AnalyticsKpis): AnalyticsConversion {
  return {
    branchViewToNavigation: safeRatio(kpis.navigationClicks, kpis.branchViews),
    branchViewToPhone: safeRatio(kpis.phoneClicks, kpis.branchViews),
    branchViewToWhatsapp: safeRatio(kpis.whatsappClicks, kpis.branchViews),
    promotionViewToClick: safeRatio(kpis.promotionClicks, kpis.promotionViews),
  };
}

/** Variation en % vs période précédente de même durée (§17) — `null` quand
 * la valeur précédente est nulle (jamais un faux "+∞%" ou "+100%"). */
export function computeDeltaPercent(
  current: AnalyticsKpis,
  previous: AnalyticsKpis
): Record<keyof AnalyticsKpis, number | null> {
  const result = {} as Record<keyof AnalyticsKpis, number | null>;
  for (const key of ANALYTICS_KPI_KEYS) {
    const prev = previous[key];
    result[key] = prev > 0 ? ((current[key] - prev) / prev) * 100 : null;
  }
  return result;
}

/** Types d'événement effectivement représentés dans la série quotidienne
 * (§16) — un sous-ensemble volontairement restreint aux graphiques
 * demandés ("évolution des visites", "intentions de visite par jour",
 * "navigation/téléphone/WhatsApp", "engagement promotions"), pas les 15
 * événements du catalogue (§16 : "pas un dashboard avec 25 graphiques
 * décoratifs"). */
const DAILY_SERIES_TYPES: readonly DbEventType[] = [
  "LOCATOR_VIEW",
  "BRANCH_VIEW",
  "WAZE_CLICK",
  "GOOGLE_MAPS_CLICK",
  "APPLE_MAPS_CLICK",
  "PHONE_CLICK",
  "WHATSAPP_CLICK",
  "PROMOTION_VIEW",
  "PROMOTION_CLICK",
];

export interface DailySeriesRawRow {
  type: DbEventType;
  createdAt: Date;
}

/** Construit une série avec UNE entrée par jour calendaire de la plage
 * (§18 : bornée en heure de Jérusalem — `startIsoDate`/`endIsoDateInclusive`
 * sont déjà des dates "métier", jamais des instants UTC), y compris les
 * jours à zéro événement (§47 : jamais un trou silencieux dans un graphique
 * — un jour sans donnée est un vrai `0`, pas une valeur absente qui
 * casserait le tracé). */
export function buildDailySeries(
  rows: readonly DailySeriesRawRow[],
  startIsoDate: string,
  endIsoDateInclusive: string
): DailySeriesPoint[] {
  const byDate = new Map<string, DailySeriesPoint>();
  for (let cursor = startIsoDate; cursor <= endIsoDateInclusive; cursor = addIsoDays(cursor, 1)) {
    byDate.set(cursor, {
      date: cursor,
      locatorViews: 0,
      branchViews: 0,
      navigationClicks: 0,
      phoneClicks: 0,
      whatsappClicks: 0,
      promotionViews: 0,
      promotionClicks: 0,
      visitIntent: 0,
    });
  }

  for (const row of rows) {
    if (!DAILY_SERIES_TYPES.includes(row.type)) continue;
    const date = jerusalemIsoDate(row.createdAt);
    const point = byDate.get(date);
    if (!point) continue; // Hors plage (ne devrait pas arriver si le repository filtre correctement) — ignoré plutôt que planter (§12 Phase 7, même tolérance).

    switch (row.type) {
      case "LOCATOR_VIEW":
        point.locatorViews += 1;
        break;
      case "BRANCH_VIEW":
        point.branchViews += 1;
        break;
      case "WAZE_CLICK":
      case "GOOGLE_MAPS_CLICK":
      case "APPLE_MAPS_CLICK":
        point.navigationClicks += 1;
        point.visitIntent += 1;
        break;
      case "PHONE_CLICK":
        point.phoneClicks += 1;
        point.visitIntent += 1;
        break;
      case "WHATSAPP_CLICK":
        point.whatsappClicks += 1;
        point.visitIntent += 1;
        break;
      case "PROMOTION_VIEW":
        point.promotionViews += 1;
        break;
      case "PROMOTION_CLICK":
        point.promotionClicks += 1;
        break;
      default:
        break;
    }
  }

  return Array.from(byDate.values());
}

import type { AppLocale } from "@/types/i18n";

/**
 * DTOs du tableau de bord analytics admin (Phase 10, §9-§20). Types partagés
 * entre `services/admin/analytics.service.ts` (production) et les composants
 * `/admin/analytics` (consommation) — jamais un type Prisma généré exposé
 * jusqu'à l'UI (même principe que `AdminBranchListItem`/`AdminDashboardStats`
 * en Phase 9).
 */

export interface AnalyticsFilters {
  /** "YYYY-MM-DD", INCLUSIVE, en heure de Jérusalem (§18). */
  startDate: string;
  endDate: string;
  branchId?: string | null;
  citySlug?: string | null;
  locale?: AppLocale | null;
}

/**
 * KPI bruts (§11). `visitIntent` (§11/§20) = `navigationClicks +
 * phoneClicks + whatsappClicks` — la définition EXACTE demandée par le
 * cahier des charges ("Exemple : navigation + appel + WhatsApp"), calculée
 * en un seul endroit (`lib/analytics/queries.ts#computeVisitIntent`) et
 * réutilisée PARTOUT (KPI global, par magasin, par jour) — jamais
 * recalculée différemment ailleurs. Ce n'est PAS un compte de visiteurs
 * uniques (un même visiteur peut cliquer téléphone ET WhatsApp lors de la
 * même visite ; chaque clic est une intention distincte, comptée telle
 * quelle) — voir le commentaire de `computeVisitIntent` pour la justification
 * complète du "pas de double comptage incohérent" (§11).
 */
export interface AnalyticsKpis {
  locatorViews: number;
  branchViews: number;
  searches: number;
  zeroResultSearches: number;
  geolocationUsed: number;
  /** Agrégat waze + google + apple (§11 : "clics navigation" comme ligne
   * globale, détaillé séparément ci-dessous). */
  navigationClicks: number;
  wazeClicks: number;
  googleMapsClicks: number;
  appleMapsClicks: number;
  phoneClicks: number;
  whatsappClicks: number;
  promotionViews: number;
  promotionClicks: number;
  visitIntent: number;
}

export const ANALYTICS_KPI_KEYS = [
  "locatorViews",
  "branchViews",
  "searches",
  "zeroResultSearches",
  "geolocationUsed",
  "navigationClicks",
  "wazeClicks",
  "googleMapsClicks",
  "appleMapsClicks",
  "phoneClicks",
  "whatsappClicks",
  "promotionViews",
  "promotionClicks",
  "visitIntent",
] as const satisfies readonly (keyof AnalyticsKpis)[];

/** Ratios de conversion (§12) — JAMAIS présentés comme du chiffre d'affaires
 * ni des ventes : uniquement "interaction"/"intention de visite"/
 * "engagement" (§12, impératif de vocabulaire — appliqué dans les libellés
 * UI, `app/admin/(dashboard)/analytics/page.tsx`). `null` signifie "non
 * calculable" (dénominateur nul), jamais `0` ou `NaN` (§17 : gestion propre
 * de la division par zéro). */
export interface AnalyticsConversion {
  branchViewToNavigation: number | null;
  branchViewToPhone: number | null;
  branchViewToWhatsapp: number | null;
  promotionViewToClick: number | null;
}

/** Comparaison à la période précédente de MÊME durée (§17). `deltaPercent`
 * couvre les mêmes clés que `AnalyticsKpis` ; `null` = non calculable
 * (période précédente à 0, jamais une fausse variation "+Infinity%"). */
export interface AnalyticsPeriodComparison {
  previous: AnalyticsKpis;
  deltaPercent: Record<keyof AnalyticsKpis, number | null>;
}

export interface TopBranchRow {
  branchId: string;
  displayName: string;
  citySlug: string;
  cityName: string;
  branchViews: number;
  navigationClicks: number;
  phoneClicks: number;
  whatsappClicks: number;
  promotionViews: number;
  promotionClicks: number;
  visitIntent: number;
}

export interface SearchTopEntry {
  count: number;
}
export interface SearchTopCity extends SearchTopEntry {
  citySlug: string;
  cityName: string;
}
export interface SearchTopBranch extends SearchTopEntry {
  branchId: string;
  displayName: string;
}

/** §14 — les recherches sans résultat sont mises en avant explicitement
 * ("particulièrement importantes commercialement", cahier des charges) :
 * jamais noyées dans une simple ligne de tableau parmi d'autres. */
export interface SearchAnalysis {
  totalSearches: number;
  zeroResultCount: number;
  zeroResultRate: number | null;
  topCities: SearchTopCity[];
  topBranches: SearchTopBranch[];
  localeBreakdown: { locale: AppLocale; count: number }[];
}

/** §15 — `scope` distingue local/global SANS toucher au modèle métier
 * `Promotion` (dérivé de `appliesToAll`, déjà existant, jamais dupliqué). */
export interface PromotionAnalyticsRow {
  promotionId: string;
  title: string;
  scope: "global" | "local";
  branchCount: number;
  views: number;
  clicks: number;
  ctr: number | null;
}

/** §16 — une entrée par jour calendaire à Jérusalem (§18), jamais un
 * "bucket" UTC. */
export interface DailySeriesPoint {
  date: string;
  locatorViews: number;
  branchViews: number;
  navigationClicks: number;
  phoneClicks: number;
  whatsappClicks: number;
  promotionViews: number;
  promotionClicks: number;
  visitIntent: number;
}

export interface AnalyticsDashboardData {
  filters: AnalyticsFilters;
  kpis: AnalyticsKpis;
  comparison: AnalyticsPeriodComparison;
  conversion: AnalyticsConversion;
  topBranches: TopBranchRow[];
  search: SearchAnalysis;
  promotions: PromotionAnalyticsRow[];
  dailySeries: DailySeriesPoint[];
}

import type {
  AnalyticsDashboardData,
  DailySeriesPoint,
  PromotionAnalyticsRow,
  SearchTopBranch,
  SearchTopCity,
  TopBranchRow,
} from "@/types/analytics";

import type { ExportColumn } from "./table";

/**
 * Export analytics (Phase 10, §32) — « très utile pour les clients » (le
 * cahier des charges), donc pensé pour un directeur réseau qui l'ouvre
 * directement : XLSX à PLUSIEURS onglets (KPI, magasins, recherches,
 * promotions, série quotidienne) — le CSV, format à plat par nature,
 * n'exporte que le tableau "magasins" (le plus actionnable individuellement,
 * §13/§20), documenté comme tel dans l'UI plutôt qu'un CSV multi-sections
 * illisible.
 */

interface KpiRow {
  label: string;
  value: string;
}

export const KPI_EXPORT_COLUMNS: ExportColumn<KpiRow>[] = [
  { key: "label", label: "Indicateur", value: (r) => r.label },
  { key: "value", label: "Valeur", value: (r) => r.value },
];

function formatRatio(ratio: number | null): string {
  return ratio === null ? "n/a" : `${(ratio * 100).toFixed(1)} %`;
}

export function buildKpiExportRows(dashboard: AnalyticsDashboardData): KpiRow[] {
  const { kpis, conversion, filters } = dashboard;
  return [
    { label: "Période", value: `${filters.startDate} → ${filters.endDate}` },
    { label: "Vues Store Locator", value: String(kpis.locatorViews) },
    { label: "Vues fiches magasins", value: String(kpis.branchViews) },
    { label: "Recherches", value: String(kpis.searches) },
    { label: "Recherches sans résultat", value: String(kpis.zeroResultSearches) },
    { label: "Utilisations géolocalisation", value: String(kpis.geolocationUsed) },
    { label: "Clics navigation (total)", value: String(kpis.navigationClicks) },
    { label: "Clics Waze", value: String(kpis.wazeClicks) },
    { label: "Clics Google Maps", value: String(kpis.googleMapsClicks) },
    { label: "Clics Apple Maps", value: String(kpis.appleMapsClicks) },
    { label: "Appels", value: String(kpis.phoneClicks) },
    { label: "Clics WhatsApp", value: String(kpis.whatsappClicks) },
    { label: "Vues promotions", value: String(kpis.promotionViews) },
    { label: "Clics promotions", value: String(kpis.promotionClicks) },
    { label: "Intentions de visite", value: String(kpis.visitIntent) },
    { label: "Taux vue fiche → navigation", value: formatRatio(conversion.branchViewToNavigation) },
    { label: "Taux vue fiche → appel", value: formatRatio(conversion.branchViewToPhone) },
    { label: "Taux vue fiche → WhatsApp", value: formatRatio(conversion.branchViewToWhatsapp) },
    { label: "CTR promotions", value: formatRatio(conversion.promotionViewToClick) },
  ];
}

export const TOP_BRANCHES_EXPORT_COLUMNS: ExportColumn<TopBranchRow>[] = [
  { key: "displayName", label: "Magasin", value: (r) => r.displayName },
  { key: "cityName", label: "Ville", value: (r) => r.cityName },
  { key: "branchViews", label: "Vues", value: (r) => String(r.branchViews) },
  { key: "navigationClicks", label: "Navigation", value: (r) => String(r.navigationClicks) },
  { key: "phoneClicks", label: "Téléphone", value: (r) => String(r.phoneClicks) },
  { key: "whatsappClicks", label: "WhatsApp", value: (r) => String(r.whatsappClicks) },
  { key: "promotionViews", label: "Vues promo", value: (r) => String(r.promotionViews) },
  { key: "promotionClicks", label: "Clics promo", value: (r) => String(r.promotionClicks) },
  { key: "visitIntent", label: "Intentions de visite", value: (r) => String(r.visitIntent) },
];

export const SEARCH_CITIES_EXPORT_COLUMNS: ExportColumn<SearchTopCity>[] = [
  { key: "cityName", label: "Ville", value: (r) => r.cityName },
  { key: "count", label: "Recherches", value: (r) => String(r.count) },
];

export const SEARCH_BRANCHES_EXPORT_COLUMNS: ExportColumn<SearchTopBranch>[] = [
  { key: "displayName", label: "Magasin", value: (r) => r.displayName },
  { key: "count", label: "Recherches", value: (r) => String(r.count) },
];

export const PROMOTIONS_EXPORT_COLUMNS: ExportColumn<PromotionAnalyticsRow>[] = [
  { key: "title", label: "Promotion", value: (r) => r.title },
  { key: "scope", label: "Portée", value: (r) => (r.scope === "global" ? "Globale" : "Locale") },
  { key: "branchCount", label: "Magasins", value: (r) => String(r.branchCount) },
  { key: "views", label: "Impressions", value: (r) => String(r.views) },
  { key: "clicks", label: "Clics", value: (r) => String(r.clicks) },
  { key: "ctr", label: "CTR", value: (r) => formatRatio(r.ctr) },
];

export const DAILY_SERIES_EXPORT_COLUMNS: ExportColumn<DailySeriesPoint>[] = [
  { key: "date", label: "Date", value: (r) => r.date },
  { key: "locatorViews", label: "Vues Store Locator", value: (r) => String(r.locatorViews) },
  { key: "branchViews", label: "Vues fiches magasins", value: (r) => String(r.branchViews) },
  { key: "navigationClicks", label: "Navigation", value: (r) => String(r.navigationClicks) },
  { key: "phoneClicks", label: "Téléphone", value: (r) => String(r.phoneClicks) },
  { key: "whatsappClicks", label: "WhatsApp", value: (r) => String(r.whatsappClicks) },
  { key: "promotionViews", label: "Vues promo", value: (r) => String(r.promotionViews) },
  { key: "promotionClicks", label: "Clics promo", value: (r) => String(r.promotionClicks) },
  { key: "visitIntent", label: "Intentions de visite", value: (r) => String(r.visitIntent) },
];

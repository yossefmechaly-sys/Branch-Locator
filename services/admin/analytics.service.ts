import {
  buildDailySeries,
  computeConversion,
  computeDeltaPercent,
  kpisFromTypeCounts,
} from "@/lib/analytics/queries";
import { inclusiveDayCount, jerusalemDateRangeToUtc, previousPeriod } from "@/lib/analytics/timezone";
import type {
  AnalyticsDashboardData,
  AnalyticsFilters,
  PromotionAnalyticsRow,
  SearchAnalysis,
  TopBranchRow,
} from "@/types/analytics";
import type { AppLocale } from "@/types/i18n";

import {
  countEventsByType,
  countEventsByTypeAndBranch,
  countEventsByTypeAndPromotion,
  countSearchesByLocale,
  countSearchesByMatchedBranch,
  countZeroResultSearches,
  fetchAllBranchMeta,
  fetchAllPromotionMeta,
  fetchDailySeriesRows,
  fetchSearchCityMatches,
  resolveBranchIdsForCity,
  type AnalyticsEventWhere,
  type BranchMetaRow,
  type PromotionMetaRow,
} from "./analytics.repository";

/**
 * Orchestrateur analytics admin (Phase 10, §8-§20) — SEUL point d'entrée du
 * tableau de bord `/admin/analytics` : résout les filtres (§10) en clauses
 * `where`, appelle le repository (agrégation SQL réelle), puis
 * `lib/analytics/queries.ts` (agrégation pure) pour produire les DTOs
 * `types/analytics.ts`. Aucune requête `prisma` directe ici — voir
 * `analytics.repository.ts`.
 */
export async function getAnalyticsDashboard(filters: AnalyticsFilters): Promise<AnalyticsDashboardData> {
  const branchFilter = await resolveBranchFilter(filters);
  const where: AnalyticsEventWhere = {
    createdAt: jerusalemDateRangeToUtc(filters.startDate, filters.endDate),
    ...(branchFilter ? { branchId: branchFilter } : {}),
    ...(filters.locale ? { locale: filters.locale } : {}),
  };

  const prev = previousPeriod(filters.startDate, filters.endDate);
  const prevWhere: AnalyticsEventWhere = { ...where, createdAt: jerusalemDateRangeToUtc(prev.start, prev.end) };

  // Séquentiel et explicitement typé (pas de `Promise.all` en tableau
  // littéral) — même contournement que Phase 9 §dashboard.service.ts pour un
  // bug d'inférence TypeScript connu sur ce projet avec ce motif.
  const typeCounts = await countEventsByType(where);
  const zeroResultCount = await countZeroResultSearches(where);
  const prevTypeCounts = await countEventsByType(prevWhere);
  const prevZeroResultCount = await countZeroResultSearches(prevWhere);
  const branchTypeCounts = await countEventsByTypeAndBranch(where);
  const promotionTypeCounts = await countEventsByTypeAndPromotion(where);
  const localeCounts = await countSearchesByLocale(where);
  const searchBranchCounts = await countSearchesByMatchedBranch(where);
  const searchCityMatches = await fetchSearchCityMatches(where);
  const dailyRows = await fetchDailySeriesRows(where);
  const branchMeta = await fetchAllBranchMeta();
  const promotionMeta = await fetchAllPromotionMeta();

  const kpis = kpisFromTypeCounts(typeCounts, zeroResultCount);
  const previousKpis = kpisFromTypeCounts(prevTypeCounts, prevZeroResultCount);
  const conversion = computeConversion(kpis);
  const deltaPercent = computeDeltaPercent(kpis, previousKpis);

  const branchMetaById = new Map(branchMeta.map((branch) => [branch.id, branch]));
  const citySlugToName = new Map(branchMeta.map((branch) => [branch.citySlug, branch.cityName]));
  const promotionMetaById = new Map(promotionMeta.map((promotion) => [promotion.id, promotion]));

  const topBranches = buildTopBranches(branchTypeCounts, branchMetaById);
  const promotions = buildPromotionRows(promotionTypeCounts, promotionMetaById);
  const search = buildSearchAnalysis({
    totalSearches: kpis.searches,
    zeroResultCount,
    localeCounts,
    searchBranchCounts,
    searchCityMatches,
    branchMetaById,
    citySlugToName,
  });
  const dailySeries = buildDailySeries(dailyRows, filters.startDate, filters.endDate);

  return {
    filters,
    kpis,
    comparison: { previous: previousKpis, deltaPercent },
    conversion,
    topBranches,
    search,
    promotions,
    dailySeries,
  };
}

async function resolveBranchFilter(filters: AnalyticsFilters): Promise<string | { in: string[] } | undefined> {
  if (filters.branchId) return filters.branchId;
  if (filters.citySlug) {
    const ids = await resolveBranchIdsForCity(filters.citySlug);
    // Ville sans magasin (ne devrait pas arriver, §34 Phase 8 le garantit déjà
    // pour l'affichage public, mais l'admin gère aussi des villes fraîchement
    // créées sans magasin) — `{ in: [] }` renvoie 0 ligne plutôt que "tous les
    // magasins", jamais un filtre silencieusement ignoré.
    return { in: ids };
  }
  return undefined;
}

function buildTopBranches(
  branchTypeCounts: { branchId: string; type: string; count: number }[],
  branchMetaById: Map<string, BranchMetaRow>
): TopBranchRow[] {
  const byBranch = new Map<string, TopBranchRow>();

  for (const row of branchTypeCounts) {
    const meta = branchMetaById.get(row.branchId);
    if (!meta) continue; // Magasin supprimé définitivement — voir onDelete: SetNull, l'événement reste mais sans identité affichable.

    if (!byBranch.has(row.branchId)) {
      byBranch.set(row.branchId, {
        branchId: row.branchId,
        displayName: meta.displayName,
        citySlug: meta.citySlug,
        cityName: meta.cityName,
        branchViews: 0,
        navigationClicks: 0,
        phoneClicks: 0,
        whatsappClicks: 0,
        promotionViews: 0,
        promotionClicks: 0,
        visitIntent: 0,
      });
    }
    const entry = byBranch.get(row.branchId)!;

    switch (row.type) {
      case "BRANCH_VIEW":
        entry.branchViews += row.count;
        break;
      case "WAZE_CLICK":
      case "GOOGLE_MAPS_CLICK":
      case "APPLE_MAPS_CLICK":
        entry.navigationClicks += row.count;
        entry.visitIntent += row.count;
        break;
      case "PHONE_CLICK":
        entry.phoneClicks += row.count;
        entry.visitIntent += row.count;
        break;
      case "WHATSAPP_CLICK":
        entry.whatsappClicks += row.count;
        entry.visitIntent += row.count;
        break;
      case "PROMOTION_VIEW":
        entry.promotionViews += row.count;
        break;
      case "PROMOTION_CLICK":
        entry.promotionClicks += row.count;
        break;
      default:
        break;
    }
  }

  // Tri par défaut : intentions de visite décroissantes — l'UI (§13,
  // "triable") permet ensuite de trier sur n'importe quelle colonne
  // côté client, cet ordre n'est qu'un point de départ raisonnable.
  return Array.from(byBranch.values()).sort((a, b) => b.visitIntent - a.visitIntent);
}

function buildPromotionRows(
  promotionTypeCounts: { promotionId: string; type: string; count: number }[],
  promotionMetaById: Map<string, PromotionMetaRow>
): PromotionAnalyticsRow[] {
  const byPromotion = new Map<string, PromotionAnalyticsRow>();

  for (const row of promotionTypeCounts) {
    const meta = promotionMetaById.get(row.promotionId);
    if (!meta) continue;

    if (!byPromotion.has(row.promotionId)) {
      byPromotion.set(row.promotionId, {
        promotionId: row.promotionId,
        title: meta.title,
        // §15 : dérivé de `appliesToAll` (modèle métier existant), jamais
        // un second champ dupliqué.
        scope: meta.appliesToAll ? "global" : "local",
        branchCount: meta.branchCount,
        views: 0,
        clicks: 0,
        ctr: null,
      });
    }
    const entry = byPromotion.get(row.promotionId)!;
    if (row.type === "PROMOTION_VIEW") entry.views += row.count;
    else if (row.type === "PROMOTION_CLICK") entry.clicks += row.count;
  }

  for (const entry of byPromotion.values()) {
    entry.ctr = entry.views > 0 ? entry.clicks / entry.views : null;
  }

  return Array.from(byPromotion.values()).sort((a, b) => b.views - a.views);
}

function buildSearchAnalysis(input: {
  totalSearches: number;
  zeroResultCount: number;
  localeCounts: { locale: string; count: number }[];
  searchBranchCounts: { branchId: string; count: number }[];
  searchCityMatches: { metadata: { matchedCitySlug?: string | null } | null }[];
  branchMetaById: Map<string, BranchMetaRow>;
  citySlugToName: Map<string, string>;
}): SearchAnalysis {
  const cityCounts = new Map<string, number>();
  for (const row of input.searchCityMatches) {
    const slug = row.metadata?.matchedCitySlug;
    if (!slug) continue;
    cityCounts.set(slug, (cityCounts.get(slug) ?? 0) + 1);
  }

  const topCities = Array.from(cityCounts.entries())
    .map(([citySlug, count]) => ({ citySlug, cityName: input.citySlugToName.get(citySlug) ?? citySlug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topBranches = input.searchBranchCounts
    .map((row) => ({
      branchId: row.branchId,
      displayName: input.branchMetaById.get(row.branchId)?.displayName ?? row.branchId,
      count: row.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalSearches: input.totalSearches,
    zeroResultCount: input.zeroResultCount,
    zeroResultRate: input.totalSearches > 0 ? input.zeroResultCount / input.totalSearches : null,
    topCities,
    topBranches,
    localeBreakdown: input.localeCounts
      .map((row) => ({ locale: row.locale as AppLocale, count: row.count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Réexporté pour les filtres UI (§10, "période personnalisée") — évite de
 * dupliquer le calcul de longueur de période dans le composant page. */
export { inclusiveDayCount };

export interface AnalyticsFilterOptions {
  branches: { id: string; label: string }[];
  cities: { slug: string; label: string }[];
}

/**
 * Options des sélecteurs de filtre (§10 : "magasin/ville/langue") — dérivées
 * de `fetchAllBranchMeta()` (une seule requête, déjà utilisée par le tableau
 * de bord lui-même) plutôt qu'une requête `city.findMany` séparée : les
 * villes affichées ici sont exactement celles qui ont au moins un magasin
 * (jamais une ville filtrable qui ne retournerait par construction aucun
 * événement).
 */
export async function getAnalyticsFilterOptions(): Promise<AnalyticsFilterOptions> {
  const branchMeta = await fetchAllBranchMeta();

  const branches = branchMeta
    .map((branch) => ({ id: branch.id, label: branch.displayName }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const cityBySlug = new Map<string, string>();
  for (const branch of branchMeta) cityBySlug.set(branch.citySlug, branch.cityName);
  const cities = Array.from(cityBySlug.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { branches, cities };
}

import type { Metadata } from "next";

import { AnalyticsCharts } from "@/components/admin/analytics/AnalyticsCharts";
import { AnalyticsExportButtons } from "@/components/admin/analytics/AnalyticsExportButtons";
import { AnalyticsFiltersForm } from "@/components/admin/analytics/AnalyticsFiltersForm";
import { BranchActionsCard } from "@/components/admin/analytics/BranchActionsCard";
import { ConversionCards } from "@/components/admin/analytics/ConversionCards";
import { KpiCards } from "@/components/admin/analytics/KpiCards";
import { PromotionsAnalyticsTable } from "@/components/admin/analytics/PromotionsAnalyticsTable";
import { SearchAnalysisSection } from "@/components/admin/analytics/SearchAnalysisSection";
import { TopBranchesTable } from "@/components/admin/analytics/TopBranchesTable";
import { jerusalemIsoDate } from "@/lib/analytics/timezone";
import { parsePeriodKey, resolvePeriodRange } from "@/lib/analytics/period";
import { hasPermission } from "@/lib/auth/permissions";
import { requireAdminPermission } from "@/lib/auth/require";
import { getAnalyticsDashboard, getAnalyticsFilterOptions } from "@/services/admin/analytics.service";
import { locales, type AppLocale } from "@/types/i18n";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import type { AnalyticsFilters } from "@/types/analytics";

export const metadata: Metadata = { title: "Branch Locator Admin" };

/**
 * Tableau de bord analytics admin (Phase 10, §9-§20) — protégé par
 * `analytics.read` (§35 : les TROIS rôles, y compris EDITOR). Toute la
 * logique d'agrégation vit dans `services/admin/analytics.service.ts` ; cette
 * page ne fait que résoudre les filtres URL (§10) et assembler les
 * composants d'affichage.
 *
 * PAS de valeur fictive nulle part (§47) : `getAnalyticsDashboard` renvoie
 * des zéros réels quand la base est vide, jamais un faux exemple — chaque
 * composant ci-dessous affiche donc ces zéros tels quels ou un empty state
 * explicite, jamais un fallback inventé.
 */
export default async function AdminAnalyticsPage(props: {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
    branchId?: string;
    city?: string;
    locale?: string;
  }>;
}) {
  const [{ user }, searchParams, adminLocale] = await Promise.all([
    requireAdminPermission("analytics.read"),
    props.searchParams,
    getAdminLocale(),
  ]);
  const t = getAdminDictionary(adminLocale).analytics;

  const today = jerusalemIsoDate(new Date());
  const period = parsePeriodKey(searchParams.period);
  const { startDate, endDate } = resolvePeriodRange(period, today, {
    start: searchParams.start,
    end: searchParams.end,
  });
  const locale = (locales as readonly string[]).includes(searchParams.locale ?? "")
    ? (searchParams.locale as AppLocale)
    : null;

  const filters: AnalyticsFilters = {
    startDate,
    endDate,
    branchId: searchParams.branchId || null,
    citySlug: searchParams.city || null,
    locale,
  };

  // Séquentiel et explicitement typé — même contournement de bug
  // d'inférence TypeScript que partout ailleurs dans ce projet (voir
  // `services/admin/analytics.service.ts`), pas de tableau `Promise.all`
  // littéral.
  const dashboard = await getAnalyticsDashboard(filters);
  const filterOptions = await getAnalyticsFilterOptions();

  const selectedBranch = filters.branchId
    ? filterOptions.branches.find((branch) => branch.id === filters.branchId)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        {hasPermission(user.role, "analytics.export") && <AnalyticsExportButtons filters={filters} />}
      </div>

      <AnalyticsFiltersForm
        period={period}
        startDate={searchParams.start}
        endDate={searchParams.end}
        branchId={filters.branchId ?? null}
        citySlug={filters.citySlug ?? null}
        locale={locale}
        branches={filterOptions.branches}
        cities={filterOptions.cities}
      />

      {selectedBranch && (
        <BranchActionsCard branchLabel={selectedBranch.label} actionsCount={dashboard.kpis.visitIntent} />
      )}

      <KpiCards kpis={dashboard.kpis} deltaPercent={dashboard.comparison.deltaPercent} />

      <ConversionCards conversion={dashboard.conversion} />

      <AnalyticsCharts dailySeries={dashboard.dailySeries} />

      <TopBranchesTable rows={dashboard.topBranches} />

      <SearchAnalysisSection search={dashboard.search} />

      <PromotionsAnalyticsTable rows={dashboard.promotions} />
    </div>
  );
}

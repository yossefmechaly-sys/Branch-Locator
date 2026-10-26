import { prisma } from "@/lib/prisma";
import { BRANCH_EXPORT_COLUMNS, type BranchExportRow } from "@/lib/export/branch-export";
import { PROMOTION_EXPORT_COLUMNS, type PromotionExportRow } from "@/lib/export/promotion-export";
import {
  DAILY_SERIES_EXPORT_COLUMNS,
  KPI_EXPORT_COLUMNS,
  PROMOTIONS_EXPORT_COLUMNS,
  SEARCH_BRANCHES_EXPORT_COLUMNS,
  SEARCH_CITIES_EXPORT_COLUMNS,
  TOP_BRANCHES_EXPORT_COLUMNS,
  buildKpiExportRows,
} from "@/lib/export/analytics-export";
import { buildXlsxWorkbook, rowsToCsv, sheet } from "@/lib/export/table";
import type { AnalyticsDashboardData } from "@/types/analytics";
import type { OpeningHoursEntry } from "@/types/opening-hours";

/**
 * Export CSV/XLSX (Phase 10, Partie E — §31/§32/§33) — SEULE couche qui
 * touche `prisma` pour l'export magasins/promotions ; l'export analytics
 * reçoit un `AnalyticsDashboardData` déjà calculé par
 * `services/admin/analytics.service.ts` (jamais une seconde agrégation
 * dupliquée ici).
 */

interface BranchExportSourceRow {
  branchCode: string;
  slug: string;
  district: string | null;
  address: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
  whatsappGroupUrl: string | null;
  wazeUrlOverride: string | null;
  isActive: boolean;
  sortOrder: number;
  city: { slug: string };
  services: { service: { slug: string } }[];
  openingHours: OpeningHoursEntry[];
  translations: { locale: string; displayName: string }[];
}

async function fetchBranchExportRows(): Promise<BranchExportRow[]> {
  const rows = (await prisma.branch.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      branchCode: true,
      slug: true,
      district: true,
      address: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      phone: true,
      email: true,
      whatsappNumber: true,
      whatsappGroupUrl: true,
      wazeUrlOverride: true,
      isActive: true,
      sortOrder: true,
      city: { select: { slug: true } },
      services: { select: { service: { select: { slug: true } } } },
      openingHours: true,
      translations: { select: { locale: true, displayName: true } },
    },
  })) as BranchExportSourceRow[];

  return rows.map((row) => ({
    branchCode: row.branchCode,
    slug: row.slug,
    citySlug: row.city.slug,
    district: row.district,
    address: row.address,
    postalCode: row.postalCode,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    whatsappNumber: row.whatsappNumber,
    whatsappGroupUrl: row.whatsappGroupUrl,
    wazeUrlOverride: row.wazeUrlOverride,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    serviceSlugs: row.services.map((s) => s.service.slug),
    openingHours: row.openingHours,
    translations: row.translations,
  }));
}

export async function exportBranchesCsv(): Promise<string> {
  return rowsToCsv(BRANCH_EXPORT_COLUMNS, await fetchBranchExportRows());
}

export async function exportBranchesXlsx(): Promise<Buffer> {
  const rows = await fetchBranchExportRows();
  return buildXlsxWorkbook([sheet("Magasins", BRANCH_EXPORT_COLUMNS, rows)]);
}

interface PromotionExportSourceRow {
  slug: string;
  price: { toString(): string } | null;
  originalPrice: { toString(): string } | null;
  currency: string;
  unit: string;
  startDate: Date;
  endDate: Date;
  status: string;
  appliesToAll: boolean;
  isFeatured: boolean;
  priority: number;
  translations: { locale: string; productName: string | null; title: string }[];
  branches: { branch: { branchCode: string } }[];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchPromotionExportRows(): Promise<PromotionExportRow[]> {
  const rows = (await prisma.promotion.findMany({
    orderBy: [{ isFeatured: "desc" }, { priority: "desc" }],
    select: {
      slug: true,
      price: true,
      originalPrice: true,
      currency: true,
      unit: true,
      startDate: true,
      endDate: true,
      status: true,
      appliesToAll: true,
      isFeatured: true,
      priority: true,
      translations: { select: { locale: true, productName: true, title: true } },
      branches: { select: { branch: { select: { branchCode: true } } } },
    },
  })) as PromotionExportSourceRow[];

  return rows.map((row) => ({
    slug: row.slug,
    price: row.price ? row.price.toString() : null,
    originalPrice: row.originalPrice ? row.originalPrice.toString() : null,
    currency: row.currency,
    unit: row.unit,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    status: row.status,
    appliesToAll: row.appliesToAll,
    isFeatured: row.isFeatured,
    priority: row.priority,
    branchCodes: row.branches.map((b) => b.branch.branchCode),
    translations: row.translations,
  }));
}

export async function exportPromotionsCsv(): Promise<string> {
  return rowsToCsv(PROMOTION_EXPORT_COLUMNS, await fetchPromotionExportRows());
}

export async function exportPromotionsXlsx(): Promise<Buffer> {
  const rows = await fetchPromotionExportRows();
  return buildXlsxWorkbook([sheet("Promotions", PROMOTION_EXPORT_COLUMNS, rows)]);
}

/** CSV : uniquement le tableau "magasins" (le plus actionnable
 * individuellement, §13/§20) — un CSV est un format à plat, une seule table
 * à la fois (voir `lib/export/analytics-export.ts`). */
export function exportAnalyticsCsv(dashboard: AnalyticsDashboardData): string {
  return rowsToCsv(TOP_BRANCHES_EXPORT_COLUMNS, dashboard.topBranches);
}

/** XLSX : rapport complet à plusieurs onglets (§32 : « très utile pour les
 * clients ») — KPI, magasins, recherches (villes/magasins), promotions,
 * série quotidienne. */
export async function exportAnalyticsXlsx(dashboard: AnalyticsDashboardData): Promise<Buffer> {
  return buildXlsxWorkbook([
    sheet("KPI", KPI_EXPORT_COLUMNS, buildKpiExportRows(dashboard)),
    sheet("Magasins", TOP_BRANCHES_EXPORT_COLUMNS, dashboard.topBranches),
    sheet("Villes recherchées", SEARCH_CITIES_EXPORT_COLUMNS, dashboard.search.topCities),
    sheet("Magasins recherchés", SEARCH_BRANCHES_EXPORT_COLUMNS, dashboard.search.topBranches),
    sheet("Promotions", PROMOTIONS_EXPORT_COLUMNS, dashboard.promotions),
    sheet("Série quotidienne", DAILY_SERIES_EXPORT_COLUMNS, dashboard.dailySeries),
  ]);
}

import { prisma } from "@/lib/prisma";
import { buildBranchStatusViewModel } from "@/lib/opening-hours/view-model";
import { isOpenStatus } from "@/lib/opening-hours/open-at";
import { isPromotionActive } from "@/lib/promotions/filter";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";
import type { PromotionStatus } from "@/types/promotion";

/**
 * Statistiques du tableau de bord (Phase 9, §3) — AUCUN moteur d'analytics
 * ici (explicitement hors périmètre, §3) : uniquement des comptages directs
 * sur les tables déjà existantes. « Ouvert maintenant » réutilise
 * EXACTEMENT `buildBranchStatusViewModel()`/`isOpenStatus()` (Phase 7),
 * jamais une nouvelle règle d'horaires écrite pour l'admin (§5 : « ne crée
 * pas une nouvelle logique d'horaires dans l'admin »).
 */
export interface AdminDashboardStats {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  openNowBranches: number;
  totalCities: number;
  activePromotions: number;
  scheduledPromotions: number;
  recentChanges: AdminRecentChange[];
}

export interface AdminRecentChange {
  id: string;
  entityType: "Branch" | "Promotion";
  label: string;
  updatedAt: string;
}

interface BranchHoursRow {
  id: string;
  isActive: boolean;
  openingHours: OpeningHoursEntry[];
  specialHours: SpecialHoursEntry[];
}

interface RecentBranchRow {
  id: string;
  updatedAt: Date;
  translations: { locale: string; displayName: string }[];
}

interface RecentPromotionRow {
  id: string;
  updatedAt: Date;
  translations: { locale: string; title: string }[];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const referenceDate = new Date();

  const totalBranches: number = await prisma.branch.count();
  const activeBranches: number = await prisma.branch.count({ where: { isActive: true } });
  const totalCities: number = await prisma.city.count();
  const promotionStatusRows: { status: string; startDate: Date; endDate: Date }[] =
    await prisma.promotion.findMany({ select: { status: true, startDate: true, endDate: true } });
  const activeBranchRowsRaw = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, isActive: true, openingHours: true, specialHours: true },
  });

  const activeBranchRows: BranchHoursRow[] = activeBranchRowsRaw.map((branch) => ({
    ...branch,
    openingHours: branch.openingHours.map((entry) => ({
      ...entry,
      dayOfWeek: entry.dayOfWeek as OpeningHoursEntry["dayOfWeek"],
    })),
    specialHours: branch.specialHours.map((entry) => ({
      ...entry,
      date: entry.date.toISOString().slice(0, 10),
    })),
  }));

  const openNowBranches = activeBranchRows.filter((branch: BranchHoursRow) => {
    const viewModel = buildBranchStatusViewModel(
      { openingHours: branch.openingHours, specialHours: branch.specialHours },
      referenceDate
    );
    return isOpenStatus(viewModel.status);
  }).length;

  let activePromotions = 0;
  let scheduledPromotions = 0;
  for (const row of promotionStatusRows) {
    const activityInput = {
      status: row.status as PromotionStatus,
      startDate: row.startDate.toISOString().slice(0, 10),
      endDate: row.endDate.toISOString().slice(0, 10),
    };
    if (isPromotionActive(activityInput, referenceDate)) activePromotions += 1;
    if (row.status === "SCHEDULED") scheduledPromotions += 1;
  }

  const [recentBranches, recentPromotions] = await Promise.all([
    (prisma.branch.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, updatedAt: true, translations: { where: { locale: "he" } } },
    }) as Promise<RecentBranchRow[]>),
    (prisma.promotion.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, updatedAt: true, translations: { where: { locale: "he" } } },
    }) as Promise<RecentPromotionRow[]>),
  ]);

  const recentChanges: AdminRecentChange[] = [
    ...recentBranches.map((branch) => ({
      id: branch.id,
      entityType: "Branch" as const,
      label: branch.translations[0]?.displayName ?? branch.id,
      updatedAt: branch.updatedAt.toISOString(),
    })),
    ...recentPromotions.map((promotion) => ({
      id: promotion.id,
      entityType: "Promotion" as const,
      label: promotion.translations[0]?.title ?? promotion.id,
      updatedAt: promotion.updatedAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  return {
    totalBranches,
    activeBranches,
    inactiveBranches: totalBranches - activeBranches,
    openNowBranches,
    totalCities,
    activePromotions,
    scheduledPromotions,
    recentChanges,
  };
}

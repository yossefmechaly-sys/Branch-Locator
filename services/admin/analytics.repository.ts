import { prisma } from "@/lib/prisma";
import type { DbEventType } from "@/lib/analytics/queries";
import type { AppLocale } from "@/types/i18n";

/**
 * Accès données analytics (Phase 10, §8) — SEULE couche qui touche `prisma`
 * pour la LECTURE analytics (l'écriture reste `lib/analytics/providers/postgres.provider.ts`,
 * volontairement séparée — Phase 10, §1). Privilégie `groupBy`/`count` réels
 * (agrégation SQL, §8) : ne charge des lignes brutes en mémoire QUE pour ce
 * que Prisma ne sait pas agréger nativement (regroupement par jour calendaire
 * en heure de Jérusalem, `metadata` JSON — voir `lib/analytics/queries.ts`).
 *
 * `prisma` reste typé `any` de fait dans ce bac à sable (client non généré,
 * voir le rapport Phase 9 §14) — chaque fonction ci-dessous caste
 * explicitement son résultat vers une interface déclarée à la main, en
 * miroir du schéma, comme dans `services/admin/dashboard.service.ts`.
 */

export interface AnalyticsEventWhere {
  createdAt: { gte: Date; lt: Date };
  branchId?: string | { in: string[] };
  locale?: AppLocale;
}

interface TypeCountRow {
  type: DbEventType;
  _count: number;
}

interface BranchTypeCountRow {
  branchId: string;
  type: DbEventType;
  _count: number;
}

interface PromotionTypeCountRow {
  promotionId: string;
  type: DbEventType;
  _count: number;
}

interface LocaleCountRow {
  locale: string | null;
  _count: number;
}

interface SearchBranchCountRow {
  branchId: string;
  _count: number;
}

interface SearchMetadataRow {
  metadata: { matchedCitySlug?: string | null } | null;
}

interface DailyRawRow {
  type: DbEventType;
  createdAt: Date;
}

const ENGAGEMENT_TYPES: DbEventType[] = [
  "WAZE_CLICK",
  "GOOGLE_MAPS_CLICK",
  "APPLE_MAPS_CLICK",
  "PHONE_CLICK",
  "WHATSAPP_CLICK",
];

/** Comptage par type d'événement — une seule requête `groupBy`, jamais un
 * `count()` par type (§8/§39 : pas dix requêtes là où une suffit). */
export async function countEventsByType(where: AnalyticsEventWhere): Promise<Partial<Record<DbEventType, number>>> {
  const rowsRaw = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where,
    _count: true,
  });
  const rows = rowsRaw as unknown as TypeCountRow[];

  const result: Partial<Record<DbEventType, number>> = {};
  for (const row of rows) result[row.type] = row._count;
  return result;
}

/** Recherches sans résultat (§14) — `metadata.matchType` est un champ JSON,
 * non "groupable" nativement par Prisma ; un `count()` filtré dédié reste une
 * agrégation SQL réelle (jamais un chargement de lignes brutes), juste pas
 * via `groupBy`. */
export async function countZeroResultSearches(where: AnalyticsEventWhere): Promise<number> {
  return (await prisma.analyticsEvent.count({
    where: { ...where, type: "SEARCH", metadata: { path: ["matchType"], equals: "none" } },
  })) as number;
}

/** Comptage par (magasin, type) — pour le tableau "magasins les plus
 * performants" (§13) : UNE requête `groupBy` couvre tous les magasins et
 * tous les types d'engagement d'un coup, jamais une requête par magasin. */
export async function countEventsByTypeAndBranch(
  where: AnalyticsEventWhere
): Promise<{ branchId: string; type: DbEventType; count: number }[]> {
  const rowsRaw = await prisma.analyticsEvent.groupBy({
    by: ["branchId", "type"],
    where: {
      ...where,
      branchId: { not: null },
      type: { in: ["BRANCH_VIEW", ...ENGAGEMENT_TYPES, "PROMOTION_VIEW", "PROMOTION_CLICK"] },
    },
    _count: true,
  });
  const rows = rowsRaw as unknown as BranchTypeCountRow[];

  return rows.map((row) => ({ branchId: row.branchId, type: row.type, count: row._count }));
}

/** Comptage par (promotion, type) — pour §15. */
export async function countEventsByTypeAndPromotion(
  where: AnalyticsEventWhere
): Promise<{ promotionId: string; type: DbEventType; count: number }[]> {
  const rowsRaw = await prisma.analyticsEvent.groupBy({
    by: ["promotionId", "type"],
    where: { ...where, promotionId: { not: null }, type: { in: ["PROMOTION_VIEW", "PROMOTION_CLICK"] } },
    _count: true,
  });
  const rows = rowsRaw as unknown as PromotionTypeCountRow[];

  return rows.map((row) => ({ promotionId: row.promotionId, type: row.type, count: row._count }));
}

/** Langues des recherches (§14 "langues utilisées") — `locale` est une
 * colonne dédiée (pas du JSON), `groupBy` réel. */
export async function countSearchesByLocale(where: AnalyticsEventWhere): Promise<{ locale: string; count: number }[]> {
  const rowsRaw = await prisma.analyticsEvent.groupBy({
    by: ["locale"],
    where: { ...where, type: "SEARCH", locale: { not: null } },
    _count: true,
  });
  const rows = rowsRaw as unknown as LocaleCountRow[];

  return rows.filter((row): row is LocaleCountRow & { locale: string } => row.locale !== null).map((row) => ({
    locale: row.locale,
    count: row._count,
  }));
}

/** Magasins les plus recherchés (§14) — réutilise la colonne `branchId`
 * (voir `lib/analytics/normalize.ts` : une recherche reconnue comme
 * correspondant à un magasin y écrit son id, exactement comme les
 * événements de clic) — `groupBy` réel, pas de lecture de `metadata`. */
export async function countSearchesByMatchedBranch(
  where: AnalyticsEventWhere
): Promise<{ branchId: string; count: number }[]> {
  const rowsRaw = await prisma.analyticsEvent.groupBy({
    by: ["branchId"],
    where: { ...where, type: "SEARCH", branchId: { not: null } },
    _count: true,
  });
  const rows = rowsRaw as unknown as SearchBranchCountRow[];

  return rows.map((row) => ({ branchId: row.branchId, count: row._count }));
}

/** Villes les plus recherchées (§14) — `matchedCitySlug` vit dans `metadata`
 * (pas de colonne dédiée, volume borné à une dizaine de villes actives) :
 * seule requête de ce fichier qui charge des lignes ligne par ligne, MAIS
 * strictement filtrée au sous-ensemble pertinent (`type: SEARCH`, `matchType:
 * "city"`), jamais l'ensemble des événements. */
export async function fetchSearchCityMatches(where: AnalyticsEventWhere): Promise<SearchMetadataRow[]> {
  return (await prisma.analyticsEvent.findMany({
    where: { ...where, type: "SEARCH", metadata: { path: ["matchType"], equals: "city" } },
    select: { metadata: true },
  })) as SearchMetadataRow[];
}

/** Lignes brutes minimales pour la série quotidienne (§16/§18) — SEULE
 * requête de ce fichier qui peut, au volume actuel, remonter un nombre de
 * lignes proche du nombre d'événements de la période (voir le commentaire de
 * tête de `lib/analytics/timezone.ts` sur ce compromis assumé). Projection
 * minimale (`type`+`createdAt` uniquement) pour limiter le coût. */
export async function fetchDailySeriesRows(where: AnalyticsEventWhere): Promise<DailyRawRow[]> {
  return (await prisma.analyticsEvent.findMany({
    where: { ...where, type: { in: ["LOCATOR_VIEW", "BRANCH_VIEW", ...ENGAGEMENT_TYPES, "PROMOTION_VIEW", "PROMOTION_CLICK"] } },
    select: { type: true, createdAt: true },
  })) as DailyRawRow[];
}

export interface BranchMetaRow {
  id: string;
  citySlug: string;
  cityName: string;
  displayName: string;
}

/** Métadonnées d'affichage (nom HE, ville) pour TOUS les magasins — y
 * compris désactivés (§13 : un magasin désactivé garde son historique
 * analytics, jamais escamoté d'un tableau déjà filtré par période). */
export async function fetchAllBranchMeta(): Promise<BranchMetaRow[]> {
  const rows = (await prisma.branch.findMany({
    select: {
      id: true,
      translations: { where: { locale: "he" }, select: { displayName: true } },
      city: { select: { slug: true, translations: { where: { locale: "he" }, select: { name: true } } } },
    },
  })) as {
    id: string;
    translations: { displayName: string }[];
    city: { slug: string; translations: { name: string }[] };
  }[];

  return rows.map((row) => ({
    id: row.id,
    citySlug: row.city.slug,
    cityName: row.city.translations[0]?.name ?? row.city.slug,
    displayName: row.translations[0]?.displayName ?? row.id,
  }));
}

/** Ids des magasins d'une ville (résolution du filtre `citySlug`, §10). */
export async function resolveBranchIdsForCity(citySlug: string): Promise<string[]> {
  const rows = (await prisma.branch.findMany({
    where: { city: { slug: citySlug } },
    select: { id: true },
  })) as { id: string }[];
  return rows.map((row) => row.id);
}

export interface PromotionMetaRow {
  id: string;
  title: string;
  appliesToAll: boolean;
  branchCount: number;
}

/** Métadonnées d'affichage (titre HE, portée) pour TOUTES les promotions —
 * même logique que `fetchAllBranchMeta` (l'historique analytique d'une
 * promotion archivée reste consultable). */
export async function fetchAllPromotionMeta(): Promise<PromotionMetaRow[]> {
  const rows = (await prisma.promotion.findMany({
    select: {
      id: true,
      appliesToAll: true,
      translations: { where: { locale: "he" }, select: { title: true } },
      _count: { select: { branches: true } },
    },
  })) as {
    id: string;
    appliesToAll: boolean;
    translations: { title: string }[];
    _count: { branches: number };
  }[];

  return rows.map((row) => ({
    id: row.id,
    title: row.translations[0]?.title ?? row.id,
    appliesToAll: row.appliesToAll,
    branchCount: row._count.branches,
  }));
}

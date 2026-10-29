import { prisma } from "@/lib/prisma";
import type { AppLocale } from "@/types/i18n";
import type { PromotionCurrency, PromotionStatus, PromotionUnit } from "@/types/promotion";
import type { ReviewRating } from "@/types/review";

import type { BranchRepository, RawBranch, RawPromotion } from "./branch.repository";

/**
 * Implémentation Prisma de `BranchRepository` — le SEUL fichier de la couche
 * données qui importe `lib/prisma`. Tout le reste de l'application (composants,
 * hooks, `branch.service.ts`) passe par l'interface `BranchRepository`.
 *
 * Forme exacte de la requête `prisma.branch.findMany({ include: … })` ci-dessous,
 * déclarée à la main : `@prisma/client` n'exporte ses types générés qu'après
 * `prisma generate`, indisponible dans ce bac à sable (réseau bloqué — voir le
 * résumé de Phase 3). Ce type reste synchronisé avec la clause `include` : toute
 * modification de l'une doit s'accompagner de l'autre. Une fois `prisma generate`
 * exécuté chez l'utilisateur, ce fichier fonctionne sans aucune autre modification
 * (les noms de champs correspondent exactement au schéma `prisma/schema.prisma`).
 */
interface PrismaBranchQueryResult {
  id: string;
  slug: string;
  branchCode: string;
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
  mainImage: string | null;
  isActive: boolean;
  isDemo: boolean;
  sortOrder: number;
  city: {
    id: string;
    slug: string;
    latitude: number;
    longitude: number;
    translations: { locale: string; name: string }[];
  };
  translations: {
    locale: string;
    displayName: string;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  }[];
  openingHours: {
    dayOfWeek: number;
    isClosed: boolean;
    openingTime: string | null;
    closingTime: string | null;
    openingTime2: string | null;
    closingTime2: string | null;
  }[];
  specialHours: {
    date: Date;
    title: string | null;
    isClosed: boolean;
    openingTime: string | null;
    closingTime: string | null;
    openingTime2: string | null;
    closingTime2: string | null;
  }[];
  searchAliases: { locale: string; alias: string }[];
  images: { imageUrl: string; alt: string | null; sortOrder: number }[];
  services: {
    service: {
      id: string;
      slug: string;
      icon: string;
      sortOrder: number;
      translations: { locale: string; name: string; description: string | null }[];
    };
  }[];
}

/** Type minimal représentant `Prisma.Decimal` (ou tout objet équivalent
 * exposant `toString()`) — Phase 9, §2 : seule cette méthode est utilisée
 * (jamais de conversion en `number` ici), donc pas besoin d'importer le type
 * concret généré par `@prisma/client` (indisponible avant `prisma generate`
 * dans ce bac à sable, voir la remarque en tête de fichier). */
interface PrismaDecimalLike {
  toString(): string;
}

/** Forme de `prisma.promotion.findMany(...)` — même remarque que
 * `PrismaBranchQueryResult` : déclarée à la main tant que `prisma generate`
 * reste indisponible. `branches` (la relation `PromotionBranch`) est incluse
 * pour permettre à `loadPromotionsForBranches()` de répartir chaque
 * promotion locale vers le(s) bon(s) magasin(s) sans requête supplémentaire. */
interface PrismaPromotionRow {
  id: string;
  slug: string;
  image: string | null;
  price: PrismaDecimalLike | null;
  originalPrice: PrismaDecimalLike | null;
  currency: string;
  unit: string;
  startDate: Date;
  endDate: Date;
  url: string | null;
  status: string;
  appliesToAll: boolean;
  isFeatured: boolean;
  priority: number;
  translations: {
    locale: string;
    productName: string | null;
    title: string;
    description: string | null;
    ctaLabel: string | null;
  }[];
  branches: { branchId: string }[];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapPromotion(row: PrismaPromotionRow): RawPromotion {
  return {
    id: row.id,
    slug: row.slug,
    image: row.image,
    // `Decimal` → chaîne décimale (Phase 9, §2) — jamais `Number(...)` ici :
    // `RawPromotion.price` reste une chaîne jusqu'à `lib/pricing/money.ts`.
    price: row.price ? row.price.toString() : null,
    originalPrice: row.originalPrice ? row.originalPrice.toString() : null,
    currency: row.currency as PromotionCurrency,
    unit: row.unit as PromotionUnit,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    url: row.url,
    status: row.status as PromotionStatus,
    appliesToAll: row.appliesToAll,
    isFeatured: row.isFeatured,
    priority: row.priority,
    translations: row.translations.map((t) => ({
      locale: t.locale as AppLocale,
      productName: t.productName,
      title: t.title,
      description: t.description,
      ctaLabel: t.ctaLabel,
    })),
  };
}

function mapBranch(
  row: PrismaBranchQueryResult,
  promotions: RawPromotion[] = [],
  reviewRating: ReviewRating = { total: 0, averageRating: null }
): RawBranch {
  return {
    id: row.id,
    slug: row.slug,
    branchCode: row.branchCode,
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
    mainImage: row.mainImage,
    isActive: row.isActive,
    isDemo: row.isDemo,
    sortOrder: row.sortOrder,
    city: {
      id: row.city.id,
      slug: row.city.slug,
      latitude: row.city.latitude,
      longitude: row.city.longitude,
      translations: row.city.translations.map((t) => ({
        locale: t.locale as AppLocale,
        name: t.name,
      })),
    },
    translations: row.translations.map((t) => ({
      locale: t.locale as AppLocale,
      displayName: t.displayName,
      description: t.description,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    })),
    services: row.services.map(({ service }) => ({
      id: service.id,
      slug: service.slug,
      icon: service.icon,
      sortOrder: service.sortOrder,
      translations: service.translations.map((t) => ({
        locale: t.locale as AppLocale,
        name: t.name,
        description: t.description,
      })),
    })),
    openingHours: row.openingHours.map((entry) => ({
      dayOfWeek: entry.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      isClosed: entry.isClosed,
      openingTime: entry.openingTime,
      closingTime: entry.closingTime,
      openingTime2: entry.openingTime2,
      closingTime2: entry.closingTime2,
    })),
    specialHours: row.specialHours.map((entry) => ({
      date: toIsoDate(entry.date),
      title: entry.title,
      isClosed: entry.isClosed,
      openingTime: entry.openingTime,
      closingTime: entry.closingTime,
      openingTime2: entry.openingTime2,
      closingTime2: entry.closingTime2,
    })),
    searchAliases: row.searchAliases.map((alias) => ({
      locale: alias.locale as AppLocale,
      alias: alias.alias,
    })),
    images: row.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({ imageUrl: image.imageUrl, alt: image.alt, sortOrder: image.sortOrder })),
    promotions,
    reviewRating,
  };
}

/** Relations communes à `getActiveBranches()` ET `getBranchBySlug()` — un seul
 * endroit à maintenir si une relation supplémentaire est chargée un jour. */
const BRANCH_INCLUDE = {
  city: { include: { translations: true } },
  translations: true,
  openingHours: true,
  specialHours: true,
  searchAliases: true,
  images: true,
  services: { include: { service: { include: { translations: true } } } },
} as const;

/**
 * Charge, en UNE SEULE requête `prisma.promotion.findMany()`, toutes les
 * promotions candidates (globales OU explicitement liées) pour l'ensemble des
 * `branchIds` fournis, puis les répartit par magasin (Phase 9, §13/§21) —
 * jamais une requête par magasin (pas de N+1), que ce soit pour un seul
 * magasin (`getBranchBySlug()`) ou pour tout le Store Locator
 * (`getActiveBranches()`) : les deux méthodes de `prismaBranchRepository`
 * réutilisent CETTE même fonction plutôt que de dupliquer la logique de
 * répartition globale/locale.
 *
 * Le filtrage par statut/dates + le choix de LA promotion "featured" restent
 * des règles métier appliquées ensuite dans `branch.service.ts` — jamais ici
 * (même séparation que documentée sur `RawPromotion`/`RawBranch.promotions`).
 */
async function loadPromotionsForBranches(branchIds: string[]): Promise<Map<string, RawPromotion[]>> {
  const byBranchId = new Map<string, RawPromotion[]>();
  for (const id of branchIds) byBranchId.set(id, []);
  if (branchIds.length === 0) return byBranchId;

  const promotionRows = (await prisma.promotion.findMany({
    where: {
      OR: [{ appliesToAll: true }, { branches: { some: { branchId: { in: branchIds } } } }],
    },
    include: { translations: true, branches: true },
  })) as PrismaPromotionRow[];

  for (const row of promotionRows) {
    const raw = mapPromotion(row);
    if (row.appliesToAll) {
      // Globale : candidate pour TOUS les magasins de ce lot.
      for (const id of branchIds) byBranchId.get(id)?.push(raw);
    } else {
      // Locale : uniquement les magasins effectivement liés (§7), et
      // seulement ceux présents dans `branchIds` (garde défensive si la
      // relation contenait un magasin hors du lot demandé).
      for (const link of row.branches) {
        byBranchId.get(link.branchId)?.push(raw);
      }
    }
  }

  return byBranchId;
}

/** One grouped query for the entire list; unpublished reviews never contribute. */
async function loadReviewRatings(branchIds: string[]): Promise<Map<string, ReviewRating>> {
  if (!branchIds.length) return new Map();
  const groups = await prisma.branchReview.groupBy({
    by: ["branchId"],
    where: { branchId: { in: branchIds }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(groups.map((group) => [group.branchId, {
    total: group._count._all, averageRating: group._avg.rating,
  }]));
}

export const prismaBranchRepository: BranchRepository = {
  async getActiveBranches() {
    const rows = (await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: BRANCH_INCLUDE,
    })) as PrismaBranchQueryResult[];

    // Promotions candidates pour TOUS les magasins actifs, en une seule
    // requête groupée (Phase 9, §13) — évolution structurelle nécessaire :
    // avant la Phase 9, le Store Locator n'affichait aucune promotion et
    // cette méthode ne chargeait donc rien ici ; `BranchCard` a maintenant
    // besoin de `featuredPromotion` par magasin (voir `branch.service.ts`).
    const branchIds = rows.map((row) => row.id);
    const [promotionsByBranchId, ratingsByBranchId] = await Promise.all([
      loadPromotionsForBranches(branchIds), loadReviewRatings(branchIds),
    ]);

    return rows.map((row) => mapBranch(row, promotionsByBranchId.get(row.id) ?? [], ratingsByBranchId.get(row.id)));
  },

  async getBranchBySlug(slug) {
    // `isActive: true` fait partie de la requête elle-même (§1/§35 Phase 8) —
    // un magasin inexistant et un magasin inactif donnent tous deux `null`
    // ici, indistinctement : c'est exactement le comportement souhaité (la
    // page appelle `notFound()` dans les deux cas, sans avoir à faire la
    // différence — voir `services/branch.service.ts#getBranchDetailBySlug()`).
    const row = (await prisma.branch.findFirst({
      where: { slug, isActive: true },
      include: BRANCH_INCLUDE,
    })) as PrismaBranchQueryResult | null;

    if (!row) return null;

    // Deuxième requête, PROPRE à `getBranchBySlug()` : promotions globales OU
    // explicitement liées à CE magasin — deux requêtes Prisma au total pour
    // cette méthode, mais un SEUL appel service (`getBranchDetailBySlug()`)
    // et un SEUL appel page (§4 Phase 8 : « éviter les requêtes multiples
    // indépendantes DANS LA PAGE REACT », pas dans la couche donnée
    // elle-même). Réutilise `loadPromotionsForBranches()` (Phase 9, §21)
    // plutôt qu'une requête ad hoc dupliquée.
    const [promotionsByBranchId, ratingsByBranchId] = await Promise.all([
      loadPromotionsForBranches([row.id]), loadReviewRatings([row.id]),
    ]);

    return mapBranch(row, promotionsByBranchId.get(row.id) ?? [], ratingsByBranchId.get(row.id));
  },
};

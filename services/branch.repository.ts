import type { AppLocale } from "@/types/i18n";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";
import type { PromotionCurrency, PromotionStatus, PromotionUnit } from "@/types/promotion";
import type { ReviewRating } from "@/types/review";

/**
 * Couche « récupération des données » — strictement séparée de la recherche
 * (`lib/search`), des filtres (`lib/filters`), du calcul de statut
 * (`lib/opening-hours`) et de l'orchestration (`branch.service.ts`), conformément
 * au découpage demandé pour la Phase 4 (§7).
 *
 * `BranchRepository` est une interface, pas un import direct de `@prisma/client` :
 * `branch.service.ts` et toute la logique métier restent donc type-checkables et
 * testables (fixtures en mémoire) même quand `prisma generate` n'a pas encore
 * tourné — c'est le cas dans ce bac à sable de développement (voir le README
 * racine et le résumé de Phase 3 : `binaries.prisma.sh` y est bloqué par la
 * politique réseau). En production, seule `branch.repository.prisma.ts` (qui,
 * elle, touche à Prisma) a besoin que la génération ait eu lieu.
 */

export interface RawTranslated {
  locale: AppLocale;
}

export interface RawCityTranslation extends RawTranslated {
  name: string;
}

export interface RawCity {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  translations: RawCityTranslation[];
}

export interface RawServiceTranslation extends RawTranslated {
  name: string;
  description: string | null;
}

export interface RawService {
  id: string;
  slug: string;
  icon: string;
  sortOrder: number;
  translations: RawServiceTranslation[];
}

export interface RawBranchTranslation extends RawTranslated {
  displayName: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface RawSearchAlias extends RawTranslated {
  alias: string;
}

export interface RawBranchImage {
  imageUrl: string;
  alt: string | null;
  sortOrder: number;
}

export interface RawPromotionTranslation extends RawTranslated {
  /** Nom du produit affiché (Phase 9, §1/§11/§15) — `null` pour une
   * promotion éditoriale sans produit structuré. */
  productName: string | null;
  title: string;
  description: string | null;
  ctaLabel: string | null;
}

/**
 * Promotion candidate pour un magasin donné (Phase 8, §11) — le repository
 * résout déjà la relation « globale (`appliesToAll`) OU explicitement liée à
 * ce magasin (`PromotionBranch`) » : `RawBranch.promotions` ne contient donc
 * que des promotions PERTINENTES pour ce magasin, mais PAS ENCORE filtrées
 * par statut/dates — ce filtrage (§11 : « ne pas afficher les promotions
 * expirées ») est une règle métier pure, appliquée par
 * `lib/promotions/filter.ts#filterActivePromotions()` dans `branch.service.ts`,
 * jamais dans le repository.
 */
export interface RawPromotion {
  id: string;
  slug: string;
  image: string | null;
  /**
   * Tarification structurée (Phase 9, §1/§2) — chaînes décimales ("29.90"),
   * JAMAIS un `number` (voir `lib/pricing/money.ts`). `price: null` signale
   * une promotion éditoriale sans produit ; dans ce cas `originalPrice` reste
   * également `null` (une promotion sans prix n'a pas d'ancien prix).
   */
  price: string | null;
  originalPrice: string | null;
  currency: PromotionCurrency;
  unit: PromotionUnit;
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" */
  endDate: string;
  url: string | null;
  status: PromotionStatus;
  appliesToAll: boolean;
  /** "Promotion du jour" (§10) — jamais déduit, toujours la valeur brute de
   * `Promotion.isFeatured`. */
  isFeatured: boolean;
  /** Ordre d'affichage manuel (§8). */
  priority: number;
  translations: RawPromotionTranslation[];
}

export interface RawBranch {
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
  city: RawCity;
  translations: RawBranchTranslation[];
  services: RawService[];
  openingHours: OpeningHoursEntry[];
  specialHours: SpecialHoursEntry[];
  searchAliases: RawSearchAlias[];
  images: RawBranchImage[];
  /**
   * Promotions candidates pour CE magasin (globales `appliesToAll` OU
   * explicitement liées via `PromotionBranch`), PAS ENCORE filtrées par
   * statut/dates — voir la remarque sur `RawPromotion` ci-dessus.
   *
   * Renseigné par `getActiveBranches()` ET `getBranchBySlug()` (Phase 9,
   * §13/§21 — évolution structurelle du Store Locator : celui-ci a
   * maintenant besoin de calculer une `featuredPromotion` par magasin pour
   * `BranchCard`/`BranchPopup`, alors qu'avant la Phase 9 seul
   * `getBranchBySlug()` chargeait ce champ). Toujours résolu en une seule
   * requête PAR APPEL (jamais une requête N+1 par magasin) — voir
   * `services/branch.repository.prisma.ts#loadPromotionsForBranches()`.
   */
  promotions: RawPromotion[];
  reviewRating: ReviewRating;
}

export interface BranchRepository {
  /** Tous les magasins actifs, relations chargées (ville, services, horaires,
   * alias, promotions candidates — voir `RawBranch.promotions`). */
  getActiveBranches(): Promise<RawBranch[]>;
  /**
   * Un magasin par `slug`, ou `null` s'il n'existe pas OU s'il est inactif
   * (Phase 8, §1) — le filtre `isActive: true` fait partie de la requête elle-
   * même, jamais un filtrage a posteriori côté service : un magasin inactif
   * ne doit JAMAIS transiter, même un instant, hors de cette couche (§35).
   * Inclut les mêmes relations que `getActiveBranches()`, promotions
   * candidates comprises (globales ou liées) — voir `RawBranch.promotions`.
   */
  getBranchBySlug(slug: string): Promise<RawBranch | null>;
}

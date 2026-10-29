import type { BranchDetail, BranchSummary } from "@/types/branch";
import type { BranchStatusViewModel } from "@/types/opening-hours";
import type { LocalizedPromotion } from "@/types/promotion";

/**
 * `BranchStatusViewModel` par défaut pour les fixtures de test — un magasin
 * ouvert, sans particularité, jusqu'à 22:00. Les tests qui ont besoin d'un
 * autre statut passent leur propre `statusViewModel` via `overrides`.
 */
export const DEFAULT_STATUS_VIEW_MODEL: BranchStatusViewModel = {
  status: "OPEN",
  dayOfWeek: 0,
  todayHours: { openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
  isSpecialDay: false,
  specialDayTitle: null,
  minutesUntilChange: 120,
  closingTime: "22:00",
  nextOpening: null,
};

/**
 * Fabrique un `BranchSummary` complet pour les tests de composants — évite de
 * dupliquer les ~20 champs dans chaque fichier de test (`branch-popup.test.tsx`,
 * `navigation-menu.test.tsx`, `geolocation-distance.test.ts`, etc.). `id` est
 * obligatoire ; tout le reste a une valeur par défaut raisonnable et peut être
 * surchargé via `overrides`.
 */
export function makeBranchSummary(overrides: Partial<BranchSummary> & { id: string }): BranchSummary {
  return {
    slug: overrides.id,
    branchCode: "000",
    displayName: overrides.id,
    city: { id: "city", slug: "city", name: "City", latitude: 0, longitude: 0 },
    district: null,
    address: "Some street",
    latitude: 0,
    longitude: 0,
    phone: null,
    whatsappNumber: null,
    mainImage: null,
    isDemo: true,
    status: "OPEN",
    todayHours: DEFAULT_STATUS_VIEW_MODEL.todayHours,
    isSpecialDay: false,
    specialDayTitle: null,
    minutesUntilChange: 120,
    distanceMeters: null,
    openingHours: [],
    specialHours: [],
    statusViewModel: DEFAULT_STATUS_VIEW_MODEL,
    services: [],
    featuredPromotion: null,
    reviewRating: { total: 0, averageRating: null },
    ...overrides,
  };
}

/**
 * Fabrique une promotion localisée pour les tests de `BranchPromotions`
 * (Phase 8, §11/§12) — `startDate`/`endDate` par défaut englobent une plage
 * large ; les tests qui vérifient le filtrage par date passent leurs propres
 * bornes via `overrides` (ce fixture ne fait AUCUN filtrage lui-même, il
 * construit juste un objet `LocalizedPromotion` valide).
 */
export function makeLocalizedPromotion(
  overrides: Partial<LocalizedPromotion> & { id: string }
): LocalizedPromotion {
  return {
    slug: overrides.id,
    image: null,
    productName: null,
    title: "Promotion",
    description: null,
    ctaLabel: null,
    ctaUrl: null,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    price: null,
    originalPrice: null,
    currency: "ILS",
    unit: "UNIT",
    isFeatured: false,
    priority: 0,
    isLocalToBranch: false,
    ...overrides,
  };
}

/**
 * Fabrique un `BranchDetail` complet (Phase 8) — étend `makeBranchSummary()`
 * avec les champs propres à la fiche détaillée, jamais dupliqués deux fois
 * (§45 : ne pas reconstruire ce qui existe déjà).
 */
export function makeBranchDetail(overrides: Partial<BranchDetail> & { id: string }): BranchDetail {
  return {
    ...makeBranchSummary(overrides),
    description: null,
    seoTitle: null,
    seoDescription: null,
    postalCode: null,
    email: null,
    whatsappGroupUrl: null,
    wazeUrlOverride: null,
    images: [],
    promotions: [],
    ...overrides,
  };
}

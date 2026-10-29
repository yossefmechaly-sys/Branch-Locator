import type { AppLocale } from "./i18n";
import type {
  SpecialHoursEntry,
  OpeningHoursEntry,
  BranchStatus,
  TodayHours,
  BranchStatusViewModel,
} from "./opening-hours";
import type { LocalizedPromotion } from "./promotion";
import type { ReviewRating } from "./review";

/**
 * Types applicatifs (view models) consommés par les composants UI — distincts des
 * modèles Prisma (`prisma/schema.prisma`). La couche `services/` (Phase 3/4) résout
 * un enregistrement Prisma + ses traductions vers ces formes déjà localisées, avec
 * repli automatique vers l'hébreu si une traduction est manquante dans la langue
 * demandée (voir Phase 1, §4, et `services/locale-projection.ts`).
 */

export interface LocalizedCity {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface LocalizedService {
  id: string;
  slug: string;
  icon: string;
  name: string;
  description: string | null;
}

/** Résumé utilisé dans `BranchList` / `BranchCard` (Phase 4). */
export interface BranchSummary {
  id: string;
  slug: string;
  branchCode: string;
  displayName: string;
  city: LocalizedCity;
  district: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  whatsappNumber: string | null;
  mainImage: string | null;
  isDemo: boolean;
  status: BranchStatus;
  /** Horaires du jour courant (fuseau Asia/Jerusalem) — `null` si fermé toute la journée. */
  todayHours: TodayHours | null;
  isSpecialDay: boolean;
  specialDayTitle: string | null;
  /** Minutes avant le prochain changement de statut, quand il est connu. */
  minutesUntilChange: number | null;
  /** Distance en mètres depuis la position de l'utilisateur, si connue (Phase 6 — géolocalisation réelle). */
  distanceMeters: number | null;
  /**
   * Horaires BRUTS (hebdomadaires + spéciaux) du magasin (Phase 7, §13/§19) —
   * nécessaires pour deux usages distincts : le composant `OpeningHours`
   * (tableau des 7 jours, §13) et le rafraîchissement client léger du statut
   * (`lib/opening-hours/live-status.ts`, §19/§20), qui recalcule
   * `statusViewModel` à partir de CES MÊMES données plutôt que de refaire un
   * appel réseau complet. Jamais utilisées directement par `BranchCard`/
   * `BranchPopup` pour un calcul — seul `statusViewModel` (ci-dessous) l'est.
   */
  openingHours: OpeningHoursEntry[];
  specialHours: SpecialHoursEntry[];
  /**
   * Objet unique consommé par `BranchCard`/`BranchPopup` pour tout affichage
   * lié au statut (Phase 7, §16/§17/§21) — voir `BranchStatusViewModel`.
   * Calculé UNE FOIS par `buildBranchStatusViewModel()`, aussi bien au
   * premier rendu serveur qu'au rafraîchissement client périodique — jamais
   * recalculé différemment selon l'endroit.
   */
  statusViewModel: BranchStatusViewModel;
  services: LocalizedService[];
  /**
   * LA promotion "du jour" à mettre en avant pour ce magasin (Phase 9, §10/
   * §13), ou `null` si aucune promotion active de ce magasin n'est marquée
   * `isFeatured` — voir `lib/promotions/priority.ts#selectFeaturedPromotion()`.
   * `BranchCard`/`BranchPopup` sont les SEULS consommateurs : ce champ pilote
   * exclusivement l'aperçu compact optionnel dans ces deux composants,
   * jamais un marqueur Google Maps (§14 : la carte reste un outil de
   * localisation, pas un support promotionnel).
   */
  featuredPromotion: LocalizedPromotion | null;
  /** Average and count of approved customer reviews only. */
  reviewRating: ReviewRating;
}

/** Fiche complète utilisée par `/[locale]/branches/[slug]` (Phase 8). */
export interface BranchDetail extends BranchSummary {
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  postalCode: string | null;
  email: string | null;
  whatsappGroupUrl: string | null;
  wazeUrlOverride: string | null;
  images: { imageUrl: string; alt: string | null }[];
  /**
   * Promotions déjà filtrées comme actives à la date de génération de la page
   * (§11 Phase 8 — statut `ACTIVE` ET date courante dans `[startDate, endDate]`)
   * et déjà résolues pour ce magasin (globales `appliesToAll` OU explicitement
   * liées via `PromotionBranch`), déjà TRIÉES par priorité d'affichage
   * (Phase 9, §8 — locales avant globales, puis `priority` décroissant) via
   * `lib/promotions/priority.ts#sortPromotionsByPriority()`. `BranchPromotions`
   * ne recalcule ni ne re-trie jamais cette liste — voir `lib/promotions/filter.ts`.
   */
  promotions: LocalizedPromotion[];
}

export interface LocaleFallbackInfo {
  requestedLocale: AppLocale;
  resolvedLocale: AppLocale;
  usedFallback: boolean;
}

/** Résultat renvoyé par `services/branch.service.ts#getBranchLocatorData()` et par `GET /api/branches`. */
export interface BranchLocatorResult {
  branches: BranchSummary[];
  /** Villes ayant au moins un magasin actif — options du filtre `BranchFilters`. */
  cities: LocalizedCity[];
  /** Services proposés par au moins un magasin actif — options du filtre `BranchFilters`. */
  services: LocalizedService[];
  total: number;
}

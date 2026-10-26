import type { AppLocale } from "@/types/i18n";

/**
 * Catalogue COMPLET des événements analytics émis par le Store Locator public
 * (Phase 6, étendu Phase 8/9, pipeline réel Phase 10 §3). Chaque variante
 * liste explicitement son payload — AUCUN champ de coordonnées (`lat`/`lng`),
 * d'adresse, de numéro de téléphone ou de contenu WhatsApp n'existe nulle
 * part dans ces formes, PAR CONSTRUCTION (§2) : il est donc structurellement
 * impossible d'appeler `track()` avec une donnée personnelle, même par erreur
 * — le type ne le permet pas, et `lib/validators/analytics.ts` (côté
 * serveur) revalide la même contrainte indépendamment du client.
 *
 * `branchId`/`promotionId` identifient QUOI a été vu/cliqué et OÙ (quel
 * magasin), jamais QUI ni OÙ SE TROUVE la personne.
 *
 * Noms alignés EXACTEMENT sur la liste minimale du cahier des charges Phase
 * 10 (§3) — `waze_click`/`google_maps_click`/`apple_maps_click`, pas de
 * préfixe `navigation_` (renommés depuis la Phase 6 par cohérence avec ce
 * cahier des charges ET avec les valeurs déjà existantes de l'enum Prisma
 * `AnalyticsEventType`, qui n'ont jamais eu ce préfixe). Il n'existe PAS de
 * variante `navigation_click` séparée : c'est un agrégat calculé à la
 * lecture (`waze_click` + `google_maps_click` + `apple_maps_click`, voir
 * `lib/analytics/queries.ts`), jamais un événement stocké en plus des trois
 * déjà spécifiques (Phase 10 §6 : éviter la duplication).
 */
export type AnalyticsEvent =
  /** Montage réel du Store Locator (`BranchLocator`), une fois par session de
   * navigation sur `/branches` — jamais côté serveur (§34/§37 : pas de faux
   * trafic depuis une revalidation ISR). */
  | { name: "locator_view" }
  /** Recherche texte — voir `lib/analytics/search-classification.ts` (Phase
   * 10 §4) : JAMAIS la chaîne saisie elle-même, uniquement une classification
   * déjà normalisée, un compte de résultats, et — seulement quand la
   * recherche correspond précisément à l'un des deux — un identifiant STABLE
   * (slug de ville / id de magasin, jamais un texte libre) pour §14 ("villes/
   * magasins les plus recherchés"). */
  | {
      name: "search";
      resultCount: number;
      matchType: "city" | "branch" | "other" | "none";
      matchedCitySlug?: string;
      matchedBranchId?: string;
    }
  /** Un événement par filtre RÉELLEMENT changé (pas un par re-rendu) —
   * `filterName` identifie lequel, jamais sa valeur (une ville/un service
   * choisi n'est pas une donnée personnelle mais reste hors périmètre du
   * minimum demandé, §3 : "uniquement les propriétés réellement utiles"). */
  | { name: "filter_used"; filterName: "city" | "service" | "isOpenNow" }
  /** Montage réel de la fiche magasin détaillée (`BranchViewTracker`), une
   * fois par visite cliente — jamais côté serveur (Phase 8 §36). */
  | { name: "branch_view"; branchId: string }
  /** Clic sur une carte magasin dans la liste du Store Locator (`BranchCard`)
   * — distinct de `branch_view` : ouvrir/sélectionner une carte dans la liste
   * n'est pas la même intention qu'ouvrir la fiche détaillée complète. */
  | { name: "branch_card_click"; branchId: string }
  /** Clic sur un marqueur de la carte Google Maps (`BranchMap`). */
  | { name: "map_marker_click"; branchId: string }
  /** Permission de géolocalisation accordée avec succès — jamais les
   * coordonnées elles-mêmes (§2, impératif absolu de cette phase). */
  | { name: "geolocation_used" }
  | { name: "waze_click"; branchId: string }
  | { name: "google_maps_click"; branchId: string }
  | { name: "apple_maps_click"; branchId: string }
  | { name: "phone_click"; branchId: string }
  | { name: "whatsapp_click"; branchId: string }
  | { name: "promotion_view"; promotionId: string; branchId: string }
  | { name: "promotion_click"; promotionId: string; branchId: string }
  /** Langue effectivement choisie (destination), jamais la précédente — pas
   * une donnée personnelle, utile pour §11/§14 (langues utilisées). */
  | { name: "language_changed"; locale: AppLocale };

export type AnalyticsEventName = AnalyticsEvent["name"];

/** Liste exhaustive des noms valides — utilisée par `lib/validators/analytics.ts`
 * pour construire l'union Zod discriminée et par les tests pour vérifier
 * qu'aucun événement du catalogue n'est oublié côté validation serveur. */
export const ANALYTICS_EVENT_NAMES = [
  "locator_view",
  "search",
  "filter_used",
  "branch_view",
  "branch_card_click",
  "map_marker_click",
  "geolocation_used",
  "waze_click",
  "google_maps_click",
  "apple_maps_click",
  "phone_click",
  "whatsapp_click",
  "promotion_view",
  "promotion_click",
  "language_changed",
] as const satisfies readonly AnalyticsEventName[];

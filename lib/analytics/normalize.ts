import type { AnalyticsEventPayload } from "@/lib/validators/analytics";

/**
 * Représentation prête à écrire — indépendante du fournisseur (Phase 10,
 * §1) : `services/admin/analytics.service.ts` (lecture) et
 * `lib/analytics/providers/*` (écriture) manipulent tous deux CETTE forme,
 * jamais directement `AnalyticsEventPayload` (le format "sur le fil" côté
 * client) ni un type Prisma généré. C'est ce qui permet de brancher demain
 * Google Analytics/Matomo/Mixpanel/Segment à côté du fournisseur PostgreSQL
 * sans toucher à la route d'ingestion ni aux appelants `track()`.
 */
export interface NormalizedAnalyticsEvent {
  /** Valeur de l'enum Prisma `AnalyticsEventType` — une chaîne ici (jamais le
   * type généré `@prisma/client`, indisponible dans cet environnement, voir
   * le rapport Phase 9 §14) mais dont l'exhaustivité vis-à-vis du schéma est
   * couverte par `tests/unit/analytics-normalize.test.ts`. */
  type: string;
  branchId: string | null;
  promotionId: string | null;
  locale: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
}

const EVENT_NAME_TO_DB_TYPE: Record<AnalyticsEventPayload["name"], string> = {
  locator_view: "LOCATOR_VIEW",
  search: "SEARCH",
  filter_used: "FILTER_USED",
  branch_view: "BRANCH_VIEW",
  branch_card_click: "BRANCH_CARD_CLICK",
  map_marker_click: "MAP_MARKER_CLICK",
  geolocation_used: "GEOLOCATION_USED",
  waze_click: "WAZE_CLICK",
  google_maps_click: "GOOGLE_MAPS_CLICK",
  apple_maps_click: "APPLE_MAPS_CLICK",
  phone_click: "PHONE_CLICK",
  whatsapp_click: "WHATSAPP_CLICK",
  promotion_view: "PROMOTION_VIEW",
  promotion_click: "PROMOTION_CLICK",
  language_changed: "LANGUAGE_CHANGED",
};

/**
 * Traduit un événement déjà validé (`analyticsEventPayloadSchema`) en ligne
 * prête à insérer. Fonction pure, testée indépendamment de toute base ou
 * route HTTP — c'est ELLE qui décide quel champ va dans une colonne dédiée
 * (`branchId`/`promotionId`/`locale`) et lequel va dans `metadata` (jamais
 * l'inverse selon le fournisseur), donc un futur fournisseur externe
 * (Matomo, etc.) peut réutiliser exactement cette même normalisation.
 */
export function normalizeAnalyticsEvent(
  payload: AnalyticsEventPayload,
  sessionId: string | null
): NormalizedAnalyticsEvent {
  const base: NormalizedAnalyticsEvent = {
    type: EVENT_NAME_TO_DB_TYPE[payload.name],
    branchId: null,
    promotionId: null,
    locale: payload.locale ?? null,
    sessionId,
    metadata: null,
  };

  switch (payload.name) {
    case "search":
      return {
        ...base,
        // `matchedBranchId` réutilise la colonne dédiée `branchId` (même
        // signification que pour les autres événements : "quel magasin",
        // ici "quel magasin cette recherche a trouvé") ; `matchedCitySlug`
        // reste dans `metadata` (pas de colonne dédiée — volume borné, une
        // dizaine de villes, un `GROUP BY` en mémoire suffit très largement).
        branchId: payload.matchedBranchId ?? null,
        metadata: {
          resultCount: payload.resultCount,
          matchType: payload.matchType,
          matchedCitySlug: payload.matchedCitySlug ?? null,
        },
      };
    case "filter_used":
      return { ...base, metadata: { filterName: payload.filterName } };
    case "branch_view":
    case "branch_card_click":
    case "map_marker_click":
    case "waze_click":
    case "google_maps_click":
    case "apple_maps_click":
    case "phone_click":
    case "whatsapp_click":
      return { ...base, branchId: payload.branchId };
    case "promotion_view":
    case "promotion_click":
      return { ...base, branchId: payload.branchId, promotionId: payload.promotionId };
    case "language_changed":
      // La langue DE DESTINATION va dans la colonne `locale` elle-même —
      // c'est précisément ce que cette colonne signifie pour cet événement.
      return { ...base, locale: payload.locale };
    case "locator_view":
    case "geolocation_used":
      return base;
    default: {
      const exhaustive: never = payload;
      throw new Error(`Type d'événement analytics non géré : ${JSON.stringify(exhaustive)}`);
    }
  }
}

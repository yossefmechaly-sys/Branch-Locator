import { z } from "zod";

import { locales } from "@/types/i18n";

/**
 * Validation serveur de l'ingestion analytics (Phase 10, §6). Miroir EXACT du
 * catalogue `lib/analytics/events.ts#AnalyticsEvent` — toute variante ajoutée
 * là-bas doit avoir son pendant ici (`tests/unit/analytics-validator.test.ts`
 * vérifie que `ANALYTICS_EVENT_NAMES` et ce schéma restent synchronisés).
 *
 * Principe : union discriminée par `name`, une "shape" par événement, JAMAIS
 * de champ `latitude`/`longitude`/`address`/`phone` nulle part — il est donc
 * structurellement impossible qu'une coordonnée survive au `safeParse()`,
 * même si un client compromis/buggé en envoie une (Zod ignore silencieusement
 * les clés non déclarées dans chaque shape, §2/§6 : "ignore les propriétés
 * inconnues" plutôt que rejeter tout le lot pour une compatibilité
 * ascendante plus robuste face à un futur client légèrement plus récent que
 * le serveur déployé).
 */
const branchIdField = z.string().min(1).max(64);
const promotionIdField = z.string().min(1).max(64);
const localeField = z.enum(locales);

/** Chaque événement peut porter la langue d'interface courante (utile pour
 * §11/§14, "langues utilisées") — champ optionnel commun, ajouté à chaque
 * "shape" via `.extend()` plutôt qu'une `z.intersection()` séparée (plus
 * simple à raisonner avec `discriminatedUnion`, un seul passage de parsing).
 * Distinct de la "shape" propre à `language_changed`, qui porte elle la
 * langue DE DESTINATION — un concept différent. */
const withLocale = { locale: localeField.optional() };

export const analyticsEventPayloadSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("locator_view"), ...withLocale }),
  z.object({
    name: z.literal("search"),
    resultCount: z.number().int().min(0).max(10_000),
    matchType: z.enum(["city", "branch", "other", "none"]),
    matchedCitySlug: z.string().min(1).max(128).optional(),
    matchedBranchId: branchIdField.optional(),
    ...withLocale,
  }),
  z.object({
    name: z.literal("filter_used"),
    filterName: z.enum(["city", "service", "isOpenNow"]),
    ...withLocale,
  }),
  z.object({ name: z.literal("branch_view"), branchId: branchIdField, ...withLocale }),
  z.object({ name: z.literal("branch_card_click"), branchId: branchIdField, ...withLocale }),
  z.object({ name: z.literal("map_marker_click"), branchId: branchIdField, ...withLocale }),
  z.object({ name: z.literal("geolocation_used"), ...withLocale }),
  z.object({ name: z.literal("waze_click"), branchId: branchIdField, ...withLocale }),
  z.object({ name: z.literal("google_maps_click"), branchId: branchIdField, ...withLocale }),
  z.object({ name: z.literal("apple_maps_click"), branchId: branchIdField, ...withLocale }),
  z.object({ name: z.literal("phone_click"), branchId: branchIdField, ...withLocale }),
  z.object({ name: z.literal("whatsapp_click"), branchId: branchIdField, ...withLocale }),
  z.object({
    name: z.literal("promotion_view"),
    promotionId: promotionIdField,
    branchId: branchIdField,
    ...withLocale,
  }),
  z.object({
    name: z.literal("promotion_click"),
    promotionId: promotionIdField,
    branchId: branchIdField,
    ...withLocale,
  }),
  z.object({ name: z.literal("language_changed"), locale: localeField }),
]);

export type AnalyticsEventPayload = z.infer<typeof analyticsEventPayloadSchema>;

/** Taille de lot maximale (Phase 10, §6/§37) — un utilisateur réel ne génère
 * jamais plus qu'une poignée d'événements par requête `sendBeacon`/`fetch`;
 * une valeur large mais bornée protège contre un lot artificiellement gonflé
 * sans gêner un usage normal. */
export const ANALYTICS_MAX_BATCH_SIZE = 25;

/** Taille maximale du corps JSON accepté, en octets (§36/§37) — calculée côté
 * route avant même le `JSON.parse()`. */
export const ANALYTICS_MAX_PAYLOAD_BYTES = 32 * 1024;

export const analyticsIngestionBodySchema = z.object({
  events: z.array(analyticsEventPayloadSchema).min(1).max(ANALYTICS_MAX_BATCH_SIZE),
});

export type AnalyticsIngestionBody = z.infer<typeof analyticsIngestionBodySchema>;

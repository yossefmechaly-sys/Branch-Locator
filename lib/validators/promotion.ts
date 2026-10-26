import { z } from "zod";

import { decimalPriceStringSchema, localeSchema, slugSchema } from "./common";

export const promotionStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "EXPIRED",
  "ARCHIVED",
]);

/** Synchronisé à la main avec `prisma/schema.prisma#Currency` (Phase 9, §2) —
 * MVP = ILS uniquement, voir `types/promotion.ts#PromotionCurrency`. */
export const promotionCurrencySchema = z.enum(["ILS"]);

/** Synchronisé à la main avec `prisma/schema.prisma#PromotionUnit`. */
export const promotionUnitSchema = z.enum(["UNIT", "KG", "GRAM", "LITER", "ML", "PACK", "BOX"]);

export const promotionTranslationInputSchema = z.object({
  locale: localeSchema,
  /** Nom du produit affiché (§1/§11) — distinct de `title`. `null` pour une
   * promotion éditoriale sans produit structuré. */
  productName: z.string().max(160).nullable().default(null),
  title: z.string().max(160),
  description: z.string().max(1000).nullable().default(null),
  ctaLabel: z.string().max(60).nullable().default(null),
});

/**
 * Utilisé par `services/admin/promotion-admin.service.ts` et le formulaire
 * `PromotionForm` (Phase 9, §11) — reflète EXACTEMENT le modèle `Promotion`
 * livré en Phase 8b, source de vérité unique (§11 : « le formulaire doit
 * correspondre exactement au modèle Promotion désormais existant »). La
 * validation serveur ici est la SEULE qui fasse foi (§19) — le formulaire
 * réutilise ce même schéma côté client pour un retour immédiat, mais ne
 * remplace jamais cette vérification serveur.
 */
export const promotionInputSchema = z
  .object({
    slug: slugSchema,
    image: z
      .string()
      .refine(
        (value) =>
          value.startsWith("/uploads/promotions/") ||
          z.url().safeParse(value).success,
        { message: "Image invalide" }
      )
      .nullable()
      .default(null),
    // Chaînes décimales contrôlées ("29.90"), jamais `z.number()` — voir
    // `decimalPriceStringSchema` (§11 : interdiction explicite de
    // `parseFloat(price)`). `price: null` = promotion éditoriale sans
    // produit ; dans ce cas `originalPrice` doit aussi être `null` (vérifié
    // par le `.refine()` ci-dessous).
    price: decimalPriceStringSchema.nullable().default(null),
    originalPrice: decimalPriceStringSchema.nullable().default(null),
    currency: promotionCurrencySchema.default("ILS"),
    unit: promotionUnitSchema.default("UNIT"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    url: z.url().nullable().default(null),
    status: promotionStatusSchema.default("DRAFT"),
    appliesToAll: z.boolean().default(false),
    // Requis si `appliesToAll` est faux, DOIT être vide si `appliesToAll` est
    // vrai — vérifié par les deux `.refine()` ci-dessous (§12 : « l'interface
    // doit rendre impossible un état ambigu »).
    branchIds: z.array(z.string()).default([]),
    isFeatured: z.boolean().default(false),
    priority: z.number().int().default(0),
    translations: z
      .array(promotionTranslationInputSchema)
      .refine(
        (translations) =>
          translations.some(
            (entry) => entry.locale === "he" && entry.title.trim().length > 0
          ),
        {
          message: "La traduction hébreu (he) est obligatoire",
        }
      ),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate doit être postérieure ou égale à startDate",
    path: ["endDate"],
  })
  .refine((data) => data.appliesToAll || data.branchIds.length > 0, {
    message: "Sélectionner au moins un magasin, ou activer « Tous les magasins »",
    path: ["branchIds"],
  })
  .refine((data) => !data.appliesToAll || data.branchIds.length === 0, {
    message: "Une promotion globale ne peut pas cibler des magasins spécifiques",
    path: ["branchIds"],
  })
  .refine((data) => data.price !== null || data.originalPrice === null, {
    message: "Un ancien prix (originalPrice) nécessite un prix (price)",
    path: ["originalPrice"],
  });

export type PromotionInput = z.infer<typeof promotionInputSchema>;

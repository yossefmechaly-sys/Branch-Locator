import { z } from "zod";

import {
  latitudeSchema,
  longitudeSchema,
  localeSchema,
  openingHoursEntrySchema,
  slugSchema,
  timeStringSchema,
} from "./common";

export const branchTranslationInputSchema = z.object({
  locale: localeSchema,
  displayName: z.string().min(1).max(160),
  description: z.string().max(2000).nullable().default(null),
  seoTitle: z.string().max(70).nullable().default(null),
  seoDescription: z.string().max(160).nullable().default(null),
});

export const specialOpeningHoursInputSchema = z
  .object({
    date: z.coerce.date(),
    title: z.string().max(120).nullable().default(null),
    isClosed: z.boolean().default(false),
    openingTime: timeStringSchema.nullable().default(null),
    closingTime: timeStringSchema.nullable().default(null),
    openingTime2: timeStringSchema.nullable().default(null),
    closingTime2: timeStringSchema.nullable().default(null),
  })
  .refine(
    (entry) => entry.isClosed || (entry.openingTime !== null && entry.closingTime !== null),
    { message: "openingTime et closingTime sont requis quand le jour n'est pas fermé" }
  )
  // Même interdiction des créneaux traversant minuit que les horaires
  // hebdomadaires (§6, en écho à §5) — le moteur public (`lib/opening-hours/`)
  // ne les supporte pas davantage pour une date exceptionnelle.
  .refine(
    (entry) => entry.isClosed || entry.closingTime === null || entry.openingTime === null || entry.closingTime > entry.openingTime,
    { message: "closingTime doit être postérieur à openingTime", path: ["closingTime"] }
  )
  .refine(
    (entry) => entry.closingTime2 === null || entry.openingTime2 === null || entry.closingTime2 > entry.openingTime2,
    { message: "closingTime2 doit être postérieur à openingTime2", path: ["closingTime2"] }
  );

// E.164 simplifié (accepte les formats israéliens locaux saisis en back-office,
// normalisés côté serveur avant stockage).
const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\-\s]{7,20}$/, "Numéro de téléphone invalide")
  .nullable();

/** Une image déjà téléversée (Phase 9, §10) — `imageUrl` est produit par
 * `StorageProvider.save()`, jamais saisi librement par l'utilisateur. */
export const branchImageInputSchema = z.object({
  imageUrl: z.string().min(1),
  alt: z.string().max(160).nullable().default(null),
  sortOrder: z.number().int().default(0),
});

/**
 * Utilisé par `BranchForm` (Phase 9) et par `POST/PUT /api/admin/branches`.
 * Reflète le formulaire décrit au §35 du cahier des charges — la validation
 * serveur est la seule à faire foi (jamais de confiance dans le client seul,
 * §58 sécurité).
 */
export const branchInputSchema = z.object({
  slug: slugSchema,
  branchCode: z.string().min(1).max(30),
  cityId: z.string().min(1),
  district: z.string().max(120).nullable().default(null),
  address: z.string().min(1).max(200),
  postalCode: z.string().max(20).nullable().default(null),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  phone: phoneSchema.default(null),
  email: z.email().nullable().default(null),
  whatsappNumber: phoneSchema.default(null),
  whatsappGroupUrl: z.url().nullable().default(null),
  wazeUrlOverride: z.url().nullable().default(null),
  mainImage: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  serviceIds: z.array(z.string()).default([]),
  openingHours: z.array(openingHoursEntrySchema).max(7).default([]),
  specialHours: z.array(specialOpeningHoursInputSchema).default([]),
  images: z.array(branchImageInputSchema).default([]),
  translations: z
    .array(branchTranslationInputSchema)
    .refine((t) => t.some((entry) => entry.locale === "he"), {
      message: "La traduction hébreu (he) est obligatoire",
    }),
});

export type BranchInput = z.infer<typeof branchInputSchema>;

/** Query params de `GET /api/branches` (Phase 4). */
export const branchListQuerySchema = z.object({
  locale: localeSchema,
  city: z.string().optional(),
  service: z.string().optional(),
  isOpenNow: z.coerce.boolean().optional(),
  q: z.string().max(200).optional(),
});

/** Query params de `GET /api/branches/nearby` (Phase 4/6). */
export const branchNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(200_000).default(20_000), // mètres
  locale: localeSchema,
});

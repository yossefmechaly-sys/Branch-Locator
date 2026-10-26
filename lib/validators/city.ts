import { z } from "zod";

import { latitudeSchema, longitudeSchema, localeSchema, slugSchema } from "./common";

export const cityTranslationInputSchema = z.object({
  locale: localeSchema,
  name: z.string().min(1).max(120),
});

/** Utilisé par `POST/PUT /api/admin/cities` (Phase 9). */
export const cityInputSchema = z
  .object({
    slug: slugSchema,
    latitude: latitudeSchema.nullable(),
    longitude: longitudeSchema.nullable(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    // L'hébreu est la seule traduction obligatoire (cohérent avec `BranchTranslation`).
    translations: z
      .array(cityTranslationInputSchema)
      .refine((t) => t.some((entry) => entry.locale === "he"), {
        message: "La traduction hébreu (he) est obligatoire",
      }),
  })
  .refine(
    (data) =>
      (data.latitude === null && data.longitude === null) ||
      (data.latitude !== null && data.longitude !== null),
    {
      message: "La latitude et la longitude doivent être renseignées ensemble",
      path: ["latitude"],
    }
  );

export type CityInput = z.infer<typeof cityInputSchema>;

import { z } from "zod";

import { localeSchema, slugSchema } from "./common";

export const serviceTranslationInputSchema = z.object({
  locale: localeSchema,
  name: z.string().max(80),
  description: z.string().max(500).nullable().default(null),
});

/** Utilisé par `POST/PUT /api/admin/services` (Phase 9). */
export const serviceInputSchema = z.object({
  slug: slugSchema,
  // Nom d'icône Lucide (ex. "truck", "parking-circle") — validé côté UI par
  // `ServiceSelector`, ici on vérifie juste qu'une valeur non vide est fournie.
  icon: z.string().min(1).max(60),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  translations: z
    .array(serviceTranslationInputSchema)
    .refine(
      (translations) =>
        translations.some(
          (entry) => entry.locale === "he" && entry.name.trim().length > 0
        ),
      {
        message: "La traduction hébreu (he) est obligatoire",
      }
    ),
});

export type ServiceInput = z.infer<typeof serviceInputSchema>;

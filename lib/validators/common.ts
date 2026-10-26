import { z } from "zod";

import { locales } from "@/types/i18n";

/**
 * Schémas Zod partagés — importés à la fois par les Server Actions/routes
 * `/api/admin/**` (validation serveur, jamais contournable) et par les formulaires
 * React Hook Form du back-office (Phase 9), pour une seule source de vérité.
 */

export const localeSchema = z.enum(locales);

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const dayOfWeekSchema = z.number().int().min(0).max(6);

/** "HH:mm", 24h. */
export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format attendu : HH:mm (ex. 08:00)");

/**
 * Un créneau "HH:mm"/"HH:mm" est valide si les deux bornes sont présentes ET
 * `closingTime` STRICTEMENT postérieur à `openingTime` — la comparaison
 * lexicographique de deux chaînes "HH:mm" est fiable (même format à largeur
 * fixe). Un créneau `null`/`null` (absent) est toujours valide (créneau 2
 * optionnel non renseigné).
 */
function isValidSlotOrder(opening: string | null, closing: string | null): boolean {
  if (opening === null && closing === null) return true;
  if (opening === null || closing === null) return false;
  return closing > opening;
}

/**
 * Horaires hebdomadaires saisis dans l'admin (Phase 9, §5) — utilisé par
 * `OpeningHoursEditor`/`POST/PUT /api/admin/branches`, DISTINCT du repli
 * silencieux de `lib/opening-hours/normalize.ts` (qui ignore un créneau
 * invalide sans bloquer l'affichage public) : ici, une saisie invalide doit
 * être REFUSÉE avec un message clair, jamais acceptée puis silencieusement
 * ignorée (§5, impératif : « interdire explicitement les créneaux
 * traversant minuit tant qu'ils ne sont pas supportés par le moteur
 * public » — un `closingTime <= openingTime` est précisément ce cas, ainsi
 * que tout créneau mal formé).
 */
export const openingHoursEntrySchema = z
  .object({
    dayOfWeek: dayOfWeekSchema,
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
  .refine((entry) => entry.isClosed || isValidSlotOrder(entry.openingTime, entry.closingTime), {
    message: "closingTime doit être postérieur à openingTime (créneaux traversant minuit non supportés)",
    path: ["closingTime"],
  })
  .refine((entry) => isValidSlotOrder(entry.openingTime2, entry.closingTime2), {
    message: "closingTime2 doit être postérieur à openingTime2 (créneaux traversant minuit non supportés)",
    path: ["closingTime2"],
  })
  .refine(
    (entry) =>
      entry.isClosed ||
      entry.openingTime2 === null ||
      entry.closingTime === null ||
      entry.openingTime2 >= entry.closingTime,
    {
      message: "Le second créneau doit commencer après la fin du premier",
      path: ["openingTime2"],
    }
  );

/** Slug URL : minuscules, chiffres, tirets — pas d'espace ni de caractère accentué. */
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug invalide (minuscules, chiffres, tirets uniquement)");

/**
 * Chaîne décimale de prix (Phase 9, §2/§11) — MÊME motif que
 * `DECIMAL_STRING_PATTERN` de `lib/pricing/money.ts#decimalStringToCents()`
 * (au plus 2 décimales, jamais négatif) : un formulaire qui saisit "29.90"
 * doit être accepté ici EXACTEMENT comme cette fonction l'accepterait
 * ensuite — deux définitions divergentes du même format seraient une source
 * de bug (une valeur validée par Zod mais rejetée à la conversion). Validée
 * comme chaîne, JAMAIS `z.number()` : interdit tout `parseFloat(price)`
 * jusque dans la couche de validation elle-même (§11, impératif).
 */
export const decimalPriceStringSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Prix invalide (ex. 29.90) — jamais de virgule ni de symbole");

import type { OpeningHoursEntry } from "@/types/opening-hours";
import { isValidTimeString, timeToMinutes } from "./timezone";

/**
 * Nettoie une liste d'horaires hebdomadaires bruts (venant de Prisma ou d'une
 * fixture) en une forme sûre à consommer par le reste du moteur (§12) :
 *
 * - Un créneau (`openingTime`/`closingTime` ou `openingTime2`/`closingTime2`)
 *   dont l'heure est manquante, mal formée, OU inversée (fermeture avant/égale
 *   à l'ouverture) est silencieusement RETIRÉ (les deux champs deviennent
 *   `null`) plutôt que de faire planter le calcul en aval — politique
 *   conservatrice : en cas de doute, ce créneau est traité comme absent, donc
 *   fermé sur cette plage (§12 : « fermé / donnée indisponible »).
 * - Si un jour de la semaine apparaît PLUSIEURS FOIS dans la liste (doublon de
 *   `dayOfWeek`), seule la PREMIÈRE occurrence est conservée — comportement
 *   déterministe et documenté, plutôt qu'une fusion ambiguë des deux.
 * - Un jour absent de la liste n'est PAS ajouté ici (reste absent) : c'est au
 *   code appelant (`resolveDayHours`) de traiter « pas d'entrée pour ce jour »
 *   comme fermé (§5, palier 4 : fallback fermé si donnée absente).
 */
export function normalizeOpeningHours(entries: readonly OpeningHoursEntry[]): OpeningHoursEntry[] {
  const seenDays = new Set<number>();
  const result: OpeningHoursEntry[] = [];

  for (const entry of entries) {
    if (seenDays.has(entry.dayOfWeek)) continue;
    seenDays.add(entry.dayOfWeek);
    result.push(normalizeEntry(entry));
  }

  return result;
}

function normalizeEntry<T extends { isClosed: boolean; openingTime: string | null; closingTime: string | null; openingTime2: string | null; closingTime2: string | null }>(
  entry: T
): T {
  if (entry.isClosed) {
    return { ...entry, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null };
  }

  const [openingTime, closingTime] = sanitizeSlot(entry.openingTime, entry.closingTime);
  const [openingTime2, closingTime2] = sanitizeSlot(entry.openingTime2, entry.closingTime2);

  return { ...entry, openingTime, closingTime, openingTime2, closingTime2 };
}

/** Retourne le créneau tel quel s'il est valide (les deux heures présentes,
 * bien formées, ouverture STRICTEMENT avant fermeture), sinon `[null, null]`. */
function sanitizeSlot(
  opening: string | null,
  closing: string | null
): [string | null, string | null] {
  if (!isValidTimeString(opening) || !isValidTimeString(closing)) return [null, null];
  const openMinutes = timeToMinutes(opening);
  const closeMinutes = timeToMinutes(closing);
  if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) return [null, null];
  return [opening, closing];
}

/** Exporté pour réutilisation par `special.ts` (mêmes règles de tolérance,
 * simplement appliquées à une seule entrée à la fois — une date spéciale n'a
 * pas de notion de doublon à gérer au même niveau que les 7 jours de semaine). */
export { normalizeEntry as normalizeHoursSourceEntry };

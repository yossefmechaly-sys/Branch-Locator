import type { SpecialHoursEntry } from "@/types/opening-hours";
import { normalizeHoursSourceEntry } from "./normalize";

/**
 * Trouve l'horaire spécial applicable à une date donnée (§4/§12), en tolérant
 * les mêmes anomalies que `normalizeOpeningHours()` : heures manquantes/mal
 * formées/inversées retirées, jamais propagées telles quelles au reste du
 * moteur. Si PLUSIEURS entrées partagent la même date (doublon administratif),
 * la PREMIÈRE de la liste est retenue — déterministe, documenté, jamais une
 * fusion ambiguë des deux.
 *
 * Retourne `null` si aucun horaire spécial n'existe pour cette date — dans ce
 * cas, `resolveDayHours()` retombe sur l'horaire hebdomadaire normal (§5).
 */
export function resolveSpecialOpeningHours(
  specialHours: readonly SpecialHoursEntry[],
  isoDate: string
): SpecialHoursEntry | null {
  const match = specialHours.find((entry) => entry.date === isoDate);
  if (!match) return null;
  return normalizeHoursSourceEntry(match);
}

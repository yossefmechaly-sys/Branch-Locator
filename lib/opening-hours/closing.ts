import type { TimeString } from "@/types/opening-hours";
import { getIsraelNow } from "./timezone";
import { resolveDayHours, type ResolveDayHoursInput } from "./resolve-day";
import { getSlotsForSource } from "./slots";

/**
 * Heure de fermeture du créneau ACTUELLEMENT actif (§9) — `null` si le
 * magasin n'est pas ouvert à `referenceDate`. Avec deux créneaux (coupure
 * méridienne), retourne la fin du créneau précis dans lequel tombe l'heure
 * courante, jamais la fermeture globale de la journée :
 *   08:00–13:00 / 16:00–22:00 → à 12:00, retourne "13:00" ; à 18:00, "22:00".
 */
export function getClosingTime(
  input: ResolveDayHoursInput,
  referenceDate: Date = new Date()
): TimeString | null {
  const { dayOfWeek, minutesSinceMidnight, isoDate } = getIsraelNow(referenceDate);
  const resolution = resolveDayHours(input, isoDate, dayOfWeek);

  if (resolution.isExceptionalClosure || !resolution.source) return null;

  const activeSlot = getSlotsForSource(resolution.source).find(
    (slot) => minutesSinceMidnight >= slot.start && minutesSinceMidnight < slot.end
  );

  return activeSlot?.closingTimeRaw ?? null;
}

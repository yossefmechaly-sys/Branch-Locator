import type { NextOpeningTimeResult } from "@/types/opening-hours";
import { NEXT_OPENING_SEARCH_WINDOW_DAYS } from "./config";
import { addIsoDays, dayOfWeekForIsoDate, getIsraelNow } from "./timezone";
import { resolveDayHours, type ResolveDayHoursInput } from "./resolve-day";
import { getSlotsForSource } from "./slots";

export type { NextOpeningTimeResult };

/**
 * Cherche la PROCHAINE ouverture, dans l'ordre : plus tard aujourd'hui →
 * demain → les jours suivants (§8), sur une fenêtre bornée de
 * `NEXT_OPENING_SEARCH_WINDOW_DAYS` jours (config centrale, jamais une boucle
 * indéfinie) — retourne `null` explicitement si aucune ouverture n'est
 * trouvée dans cette fenêtre (magasin durablement fermé / sans horaires
 * exploitables).
 *
 * Pour aujourd'hui (offset 0), ne considère que les créneaux qui commencent
 * APRÈS l'heure courante (un créneau déjà entamé ou passé n'est pas « la
 * prochaine ouverture »). Pour les jours suivants, prend le premier créneau
 * de la journée, quel qu'il soit.
 */
export function getNextOpeningTime(
  input: ResolveDayHoursInput,
  referenceDate: Date = new Date()
): NextOpeningTimeResult | null {
  const { minutesSinceMidnight, isoDate: todayIsoDate } = getIsraelNow(referenceDate);

  for (let offset = 0; offset < NEXT_OPENING_SEARCH_WINDOW_DAYS; offset += 1) {
    const isoDate = offset === 0 ? todayIsoDate : addIsoDays(todayIsoDate, offset);
    const dayOfWeek = dayOfWeekForIsoDate(isoDate);
    const resolution = resolveDayHours(input, isoDate, dayOfWeek);

    if (resolution.isExceptionalClosure || !resolution.source || resolution.source.isClosed) continue;

    const slots = getSlotsForSource(resolution.source);
    const candidates =
      offset === 0 ? slots.filter((slot) => slot.start > minutesSinceMidnight) : slots;
    if (candidates.length === 0) continue;

    const earliest = candidates.slice().sort((a, b) => a.start - b.start)[0];
    return { isoDate, dayOfWeek, time: earliest.openingTimeRaw, daysFromNow: offset };
  }

  return null;
}

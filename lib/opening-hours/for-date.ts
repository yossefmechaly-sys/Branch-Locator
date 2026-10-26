import type { OpeningHoursForDateResult } from "@/types/opening-hours";
import { dayOfWeekForIsoDate } from "./timezone";
import { resolveDayHours, type ResolveDayHoursInput } from "./resolve-day";

export type { OpeningHoursForDateResult };

/**
 * Résout les horaires d'une date ARBITRAIRE (pas nécessairement aujourd'hui),
 * en appliquant la même priorité que `getBranchStatus()` (§5) via
 * `resolveDayHours()` — utilisé par `getTodayOpeningHours()` (cas particulier
 * `isoDate = aujourd'hui`) et disponible pour tout futur usage (calendrier,
 * page de détail Phase 8) sans dupliquer la logique de résolution.
 */
export function getOpeningHoursForDate(
  input: ResolveDayHoursInput,
  isoDate: string
): OpeningHoursForDateResult {
  const dayOfWeek = dayOfWeekForIsoDate(isoDate);
  const resolution = resolveDayHours(input, isoDate, dayOfWeek);

  if (resolution.isExceptionalClosure || !resolution.source || resolution.source.isClosed) {
    return {
      isoDate,
      dayOfWeek,
      isClosed: true,
      hours: null,
      isSpecialDay: resolution.isSpecialDay,
      specialDayTitle: resolution.specialDayTitle,
    };
  }

  return {
    isoDate,
    dayOfWeek,
    isClosed: false,
    hours: {
      openingTime: resolution.source.openingTime,
      closingTime: resolution.source.closingTime,
      openingTime2: resolution.source.openingTime2,
      closingTime2: resolution.source.closingTime2,
    },
    isSpecialDay: resolution.isSpecialDay,
    specialDayTitle: resolution.specialDayTitle,
  };
}

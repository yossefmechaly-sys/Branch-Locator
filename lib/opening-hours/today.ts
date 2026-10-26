import { getIsraelNow } from "./timezone";
import { getOpeningHoursForDate, type OpeningHoursForDateResult } from "./for-date";
import type { ResolveDayHoursInput } from "./resolve-day";

/**
 * Horaires du jour COURANT (Israël) — cas particulier de
 * `getOpeningHoursForDate()` avec `isoDate = aujourd'hui`, sans réimplémenter
 * la résolution (§18).
 */
export function getTodayOpeningHours(
  input: ResolveDayHoursInput,
  referenceDate: Date = new Date()
): OpeningHoursForDateResult {
  const { isoDate } = getIsraelNow(referenceDate);
  return getOpeningHoursForDate(input, isoDate);
}

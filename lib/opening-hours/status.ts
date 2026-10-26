import type { OpeningHoursEntry, SpecialHoursEntry, BranchStatus, BranchStatusResult } from "@/types/opening-hours";
import { SOON_THRESHOLD_MINUTES } from "./config";
import { getIsraelNow } from "./timezone";
import { resolveDayHours } from "./resolve-day";
import { getSlotsForSource } from "./slots";

/**
 * Moteur de statut horaire — fonction pure, aucune dépendance à React/Next/Prisma
 * (§1/§21). Toujours calculé dans le fuseau `Asia/Jerusalem` via `getIsraelNow()`
 * (`lib/opening-hours/timezone.ts`), jamais celui du serveur ou du navigateur.
 *
 * Compose `resolveDayHours()` (priorité spécial > hebdo > fermé, §5) et
 * `getSlotsForSource()` (créneaux, y compris coupure méridienne, §3) — ne
 * réimplémente aucune de ces deux règles lui-même.
 */

export interface GetBranchStatusInput {
  openingHours: readonly OpeningHoursEntry[];
  specialHours: readonly SpecialHoursEntry[];
}

function closedResult(
  isSpecialDay: boolean,
  specialDayTitle: string | null,
  status: BranchStatus = "CLOSED"
): BranchStatusResult {
  return { status, todayHours: null, isSpecialDay, specialDayTitle, minutesUntilChange: null };
}

/**
 * Calcule le statut d'un magasin à un instant donné (par défaut : maintenant).
 *
 * Statuts (§6) : `OPEN`, `CLOSED`, `OPENING_SOON`/`CLOSING_SOON` (à moins de
 * `SOON_THRESHOLD_MINUTES` — `lib/opening-hours/config.ts` — d'un changement),
 * `TEMPORARILY_CLOSED` (fermeture exceptionnelle déclarée, distincte d'un
 * simple jour de repos hebdomadaire).
 */
export function getBranchStatus(
  input: GetBranchStatusInput,
  referenceDate: Date = new Date()
): BranchStatusResult {
  const { dayOfWeek, minutesSinceMidnight, isoDate } = getIsraelNow(referenceDate);
  const resolution = resolveDayHours(input, isoDate, dayOfWeek);
  const { isSpecialDay, specialDayTitle } = resolution;

  if (resolution.isExceptionalClosure) {
    return closedResult(isSpecialDay, specialDayTitle, "TEMPORARILY_CLOSED");
  }

  if (!resolution.source || resolution.source.isClosed) {
    return closedResult(isSpecialDay, specialDayTitle);
  }

  const slots = getSlotsForSource(resolution.source);
  if (slots.length === 0) {
    return closedResult(isSpecialDay, specialDayTitle);
  }

  const todayHours = {
    openingTime: resolution.source.openingTime,
    closingTime: resolution.source.closingTime,
    openingTime2: resolution.source.openingTime2,
    closingTime2: resolution.source.closingTime2,
  };

  const activeSlot = slots.find(
    (slot) => minutesSinceMidnight >= slot.start && minutesSinceMidnight < slot.end
  );

  if (activeSlot) {
    const minutesUntilClose = activeSlot.end - minutesSinceMidnight;
    return {
      status: minutesUntilClose <= SOON_THRESHOLD_MINUTES ? "CLOSING_SOON" : "OPEN",
      todayHours,
      isSpecialDay,
      specialDayTitle,
      minutesUntilChange: minutesUntilClose,
    };
  }

  const nextSlot = slots
    .filter((slot) => slot.start > minutesSinceMidnight)
    .sort((a, b) => a.start - b.start)[0];

  if (nextSlot) {
    const minutesUntilOpen = nextSlot.start - minutesSinceMidnight;
    if (minutesUntilOpen <= SOON_THRESHOLD_MINUTES) {
      return {
        status: "OPENING_SOON",
        todayHours,
        isSpecialDay,
        specialDayTitle,
        minutesUntilChange: minutesUntilOpen,
      };
    }
  }

  return {
    status: "CLOSED",
    todayHours,
    isSpecialDay,
    specialDayTitle,
    minutesUntilChange: null,
  };
}

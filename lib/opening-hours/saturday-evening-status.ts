import type { SaturdayEveningHours } from "@/types/branch";
import type { BranchStatusResult } from "@/types/opening-hours";
import { getIsraelNow } from "./timezone";

export function applySaturdayEveningStatus(
  result: BranchStatusResult,
  saturdayEveningHours: SaturdayEveningHours | null | undefined,
  referenceDate: Date
): BranchStatusResult {
  if (!saturdayEveningHours || result.isSpecialDay) {
    return result;
  }

  const israelNow = getIsraelNow(referenceDate);

  if (israelNow.dayOfWeek !== 6) {
    return result;
  }

  const closingTime = saturdayEveningHours.closingTime;

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(closingTime)) {
    return {
      ...result,
      status: "HOURS_UNCONFIRMED",
      todayHours: null,
      minutesUntilChange: null,
    };
  }

  const [hours, minutes] = closingTime.split(":").map(Number);
  const closingMinutes = hours * 60 + minutes;

  return {
    ...result,
    status:
      israelNow.minutesSinceMidnight >= closingMinutes
        ? "CLOSED"
        : "HOURS_UNCONFIRMED",
    todayHours: null,
    minutesUntilChange: null,
  };
}

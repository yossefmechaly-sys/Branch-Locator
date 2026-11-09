import { Location, Zmanim } from "@hebcal/core";
import type { SaturdayEveningHours } from "@/types/branch";
import { getIsraelNow } from "./timezone";

export type LeaderShabbatConvention = "TZEIT_8_5" | "TZEIT_72";

export interface LeaderSaturdaySlot {
  openingTimestamp: number;
  closingTimestamp: number;
}

/**
 * Calcule un créneau estimé pour les magasins Leader ouverts
 * une heure après la sortie de Shabbat.
 *
 * Convention provisoire : tzeit() à 8,5 degrés.
 * Ne constitue pas une confirmation de l'horaire par Leader.
 */
export function getLeaderSaturdaySlot(
  hours: SaturdayEveningHours | null,
  latitude: number,
  longitude: number,
  referenceDate: Date,
  convention: LeaderShabbatConvention = "TZEIT_8_5"
): LeaderSaturdaySlot | null {
  if (!hours || hours.openingRule !== "ONE_HOUR_AFTER_SHABBAT") {
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  const israelNow = getIsraelNow(referenceDate);

  if (israelNow.dayOfWeek !== 6) {
    return null;
  }

  const [year, month, day] = israelNow.isoDate.split("-").map(Number);

  const calendarDate = new Date(Date.UTC(year, month - 1, day, 12));

  const location = new Location(
    latitude,
    longitude,
    false,
    "Asia/Jerusalem",
    "Leader",
    "IL"
  );

  const zmanim = new Zmanim(location, calendarDate, false);

  const shabbatEnd =
    convention === "TZEIT_72"
      ? zmanim.tzeit72()?.epochMilliseconds
      : zmanim.tzeit()?.getTime();

  if (shabbatEnd == null || !Number.isFinite(shabbatEnd)) {
    return null;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hours.closingTime);

  if (!match) {
    return null;
  }

  const closingHour = Number(match[1]);
  const closingMinute = Number(match[2]);

  const openingTimestamp = shabbatEnd + 60 * 60 * 1000;

  // L'heure de fermeture est exprimée en heure locale israélienne.
  // On recherche son instant UTC par comparaison dans Asia/Jerusalem.
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const approximateUtc = Date.UTC(
    year, month - 1, day, closingHour, closingMinute
  );

  let closingTimestamp: number | null = null;

  for (let offset = -4; offset <= 4; offset++) {
    const candidate = approximateUtc + offset * 60 * 60 * 1000;
    if (format.format(new Date(candidate)) === hours.closingTime) {
      closingTimestamp = candidate;
      break;
    }
  }

  if (closingTimestamp == null || closingTimestamp <= openingTimestamp) {
    return null;
  }

  return { openingTimestamp, closingTimestamp };
}

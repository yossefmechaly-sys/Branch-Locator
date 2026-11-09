import { describe, expect, it } from "vitest";
import { getLeaderSaturdaySlot } from "../../lib/opening-hours/leader-shabbat.mjs";
import type { SaturdayEveningHours } from "../../types/branch";

const hours: SaturdayEveningHours = {
  openingRule: "ONE_HOUR_AFTER_SHABBAT",
  closingTime: "23:00",
  officialTextHe: "שעה אחרי צאת השבת עד 23:00",
};

const formatIsrael = (timestamp: number) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));

describe("Leader — horaires du samedi soir", () => {
  it.each([
    ["2026-06-20", "21:30"],
    ["2026-10-17", "19:41"],
    ["2026-10-24", "19:34"],
    ["2026-10-31", "18:27"],
    ["2026-12-19", "18:18"],
  ])("calcule le samedi %s", (date, expectedOpening) => {
    const slot = getLeaderSaturdaySlot(
      hours,
      31.812,
      35.195,
      new Date(`${date}T12:00:00Z`)
    );

    expect(slot).not.toBeNull();
    expect(formatIsrael(slot!.openingTimestamp)).toBe(expectedOpening);
    expect(formatIsrael(slot!.closingTimestamp)).toBe("23:00");
  });

  it("ne calcule rien pour un magasin sans ouverture samedi soir", () => {
    expect(
      getLeaderSaturdaySlot(null, 31.812, 35.195, new Date("2026-10-17T12:00:00Z"))
    ).toBeNull();
  });

  it("ne calcule rien un jour autre que samedi", () => {
    expect(
      getLeaderSaturdaySlot(hours, 31.812, 35.195, new Date("2026-10-18T12:00:00Z"))
    ).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { isBranchOpenAt, isOpenStatus } from "@/lib/opening-hours/open-at";
import type { OpeningHoursEntry } from "@/types/opening-hours";

function israelTime(utc: [number, number, number, number, number]): Date {
  const [year, monthIndex, day, hour, minute] = utc;
  return new Date(Date.UTC(year, monthIndex, day, hour, minute));
}

const STANDARD_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 0, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
];

describe("isOpenStatus — définition partagée de « ouvert » (§18)", () => {
  it("considère OPEN et CLOSING_SOON comme ouverts", () => {
    expect(isOpenStatus("OPEN")).toBe(true);
    expect(isOpenStatus("CLOSING_SOON")).toBe(true);
  });

  it("ne considère ni CLOSED, ni OPENING_SOON, ni TEMPORARILY_CLOSED comme ouverts", () => {
    expect(isOpenStatus("CLOSED")).toBe(false);
    expect(isOpenStatus("OPENING_SOON")).toBe(false);
    expect(isOpenStatus("TEMPORARILY_CLOSED")).toBe(false);
  });
});

describe("isBranchOpenAt — projection booléenne de getBranchStatus (§18)", () => {
  it("retourne true en milieu de journée d'ouverture", () => {
    const result = isBranchOpenAt({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 8, 0]));
    expect(result).toBe(true);
  });

  it("retourne false après la fermeture", () => {
    const result = isBranchOpenAt({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 21, 0]));
    expect(result).toBe(false);
  });

  it("retourne true peu avant la fermeture (statut CLOSING_SOON, toujours physiquement ouvert)", () => {
    const result = isBranchOpenAt({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 19, 45]));
    expect(result).toBe(true);
  });
});

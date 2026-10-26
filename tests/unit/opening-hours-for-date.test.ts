import { describe, expect, it } from "vitest";

import { getOpeningHoursForDate } from "@/lib/opening-hours/for-date";
import { getTodayOpeningHours } from "@/lib/opening-hours/today";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";

const STANDARD_HOURS: OpeningHoursEntry[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek: dayOfWeek as OpeningHoursEntry["dayOfWeek"],
  isClosed: false,
  openingTime: "07:00",
  closingTime: "22:00",
  openingTime2: null,
  closingTime2: null,
}));
STANDARD_HOURS.push(
  { dayOfWeek: 5, isClosed: false, openingTime: "07:00", closingTime: "15:00", openingTime2: null, closingTime2: null },
  { dayOfWeek: 6, isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null }
);

describe("getOpeningHoursForDate — date arbitraire (§1/§5)", () => {
  it("résout un jour ouvert normal", () => {
    const result = getOpeningHoursForDate({ openingHours: STANDARD_HOURS, specialHours: [] }, "2026-01-04");
    expect(result).toEqual({
      isoDate: "2026-01-04",
      dayOfWeek: 0,
      isClosed: false,
      hours: { openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
      isSpecialDay: false,
      specialDayTitle: null,
    });
  });

  it("résout un jour de repos hebdomadaire (samedi) comme fermé, sans horaires", () => {
    const result = getOpeningHoursForDate({ openingHours: STANDARD_HOURS, specialHours: [] }, "2026-01-10");
    expect(result.isClosed).toBe(true);
    expect(result.hours).toBeNull();
    expect(result.dayOfWeek).toBe(6);
  });

  it("résout une date avec horaires spéciaux réduits comme ouverte, avec les horaires spéciaux", () => {
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-09-11", title: "Veille de Roch Hachana", isClosed: false, openingTime: "07:00", closingTime: "14:00", openingTime2: null, closingTime2: null },
    ];
    const result = getOpeningHoursForDate({ openingHours: STANDARD_HOURS, specialHours }, "2026-09-11");
    expect(result.isClosed).toBe(false);
    expect(result.hours?.closingTime).toBe("14:00");
    expect(result.isSpecialDay).toBe(true);
    expect(result.specialDayTitle).toBe("Veille de Roch Hachana");
  });

  it("résout une fermeture exceptionnelle comme fermée, avec le titre spécial", () => {
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-09-12", title: "Roch Hachana", isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null },
    ];
    const result = getOpeningHoursForDate({ openingHours: STANDARD_HOURS, specialHours }, "2026-09-12");
    expect(result.isClosed).toBe(true);
    expect(result.hours).toBeNull();
    expect(result.isSpecialDay).toBe(true);
    expect(result.specialDayTitle).toBe("Roch Hachana");
  });

  it("résout une date sans aucune donnée exploitable comme fermée (§5, palier 4)", () => {
    const result = getOpeningHoursForDate({ openingHours: [], specialHours: [] }, "2026-01-04");
    expect(result.isClosed).toBe(true);
    expect(result.hours).toBeNull();
  });
});

describe("getTodayOpeningHours — délègue à getOpeningHoursForDate sans dupliquer la logique (§18)", () => {
  it("utilise la date ISO d'aujourd'hui (Israël) dérivée de referenceDate", () => {
    // Dimanche 04/01/2026, 10:00 heure d'Israël = 08:00 UTC.
    const result = getTodayOpeningHours({ openingHours: STANDARD_HOURS, specialHours: [] }, new Date(Date.UTC(2026, 0, 4, 8, 0)));
    expect(result.isoDate).toBe("2026-01-04");
    expect(result.dayOfWeek).toBe(0);
    expect(result.hours?.openingTime).toBe("07:00");
  });
});

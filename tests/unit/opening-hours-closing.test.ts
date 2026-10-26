import { describe, expect, it } from "vitest";

import { getClosingTime } from "@/lib/opening-hours/closing";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";

function israelTime(utc: [number, number, number, number, number]): Date {
  const [year, monthIndex, day, hour, minute] = utc;
  return new Date(Date.UTC(year, monthIndex, day, hour, minute));
}

const MERIDIAN_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 1, isClosed: false, openingTime: "08:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "22:00" },
];

const STANDARD_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 0, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
];

/**
 * §9 : « si actuellement ouvert dans un créneau donné, `getClosingTime()` doit
 * retourner la fermeture précise de CE créneau » — exemple exact de l'énoncé :
 * 08:00–13:00, 16:00–22:00 → à 12:00 : 13:00 ; à 18:00 : 22:00.
 */
describe("getClosingTime — précision du créneau actif (§9)", () => {
  it("retourne la fermeture du PREMIER créneau à 12:00 (dans 08:00–13:00)", () => {
    // Lundi 05/01/2026, 12:00 heure d'Israël = 10:00 UTC.
    const result = getClosingTime({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 10, 0]));
    expect(result).toBe("13:00");
  });

  it("retourne la fermeture du SECOND créneau à 18:00 (dans 16:00–22:00)", () => {
    // Lundi 05/01/2026, 18:00 heure d'Israël = 16:00 UTC.
    const result = getClosingTime({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 16, 0]));
    expect(result).toBe("22:00");
  });

  it("retourne null pendant la coupure méridienne (magasin fermé entre les deux créneaux)", () => {
    // Lundi 05/01/2026, 14:00 heure d'Israël = 12:00 UTC.
    const result = getClosingTime({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 12, 0]));
    expect(result).toBeNull();
  });

  it("retourne null quand le magasin est fermé (hors horaires)", () => {
    // Dimanche 04/01/2026, 23:00 heure d'Israël = 21:00 UTC — après la fermeture de 22:00.
    const result = getClosingTime({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 21, 0]));
    expect(result).toBeNull();
  });

  it("retourne null en cas de fermeture exceptionnelle, même si l'horaire hebdo dirait ouvert", () => {
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-01-04", title: "Fermeture exceptionnelle", isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null },
    ];
    const result = getClosingTime({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 0, 4, 8, 0]));
    expect(result).toBeNull();
  });

  it("respecte des horaires spéciaux réduits en priorité sur l'horaire hebdomadaire", () => {
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-01-04", title: "Veille de fête", isClosed: false, openingTime: "07:00", closingTime: "14:00", openingTime2: null, closingTime2: null },
    ];
    // 10:00 heure d'Israël, dans le créneau spécial 07:00–14:00.
    const result = getClosingTime({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 0, 4, 8, 0]));
    expect(result).toBe("14:00");
  });
});

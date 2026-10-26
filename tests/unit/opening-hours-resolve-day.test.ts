import { describe, expect, it } from "vitest";

import { resolveDayHours } from "@/lib/opening-hours/resolve-day";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";

const WEEKLY: OpeningHoursEntry[] = [
  { dayOfWeek: 0, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
];

/**
 * Vérifie explicitement les QUATRE paliers de priorité définis en §5 :
 * (1) fermeture exceptionnelle > (2) horaires spéciaux de la date >
 * (3) horaires hebdomadaires normaux > (4) repli fermé.
 */
describe("resolveDayHours — ordre de priorité explicite (§5)", () => {
  it("palier 1 : une fermeture exceptionnelle déclarée prévaut sur tout, même un jour normalement ouvert", () => {
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-01-04", title: "Fermeture exceptionnelle", isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null },
    ];
    const result = resolveDayHours({ openingHours: WEEKLY, specialHours }, "2026-01-04", 0);
    expect(result.source).toBeNull();
    expect(result.isExceptionalClosure).toBe(true);
    expect(result.isSpecialDay).toBe(true);
    expect(result.specialDayTitle).toBe("Fermeture exceptionnelle");
  });

  it("palier 2 : des horaires spéciaux (non fermés) prévalent sur les horaires hebdomadaires — exemple de l'énoncé (§4)", () => {
    // Magasin normalement ouvert dimanche 08:00–22:00, mais avec un
    // `SpecialOpeningHours` du 2026-09-13 (isClosed=true) : doit être fermé.
    const openSunday: OpeningHoursEntry[] = [
      { dayOfWeek: 0, isClosed: false, openingTime: "08:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
    ];
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-09-13", title: null, isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null },
    ];
    const result = resolveDayHours({ openingHours: openSunday, specialHours }, "2026-09-13", 0);
    expect(result.isExceptionalClosure).toBe(true);
    expect(result.source).toBeNull();
  });

  it("palier 2 (bis) : des horaires spéciaux réduits (non fermés) remplacent les horaires hebdomadaires normaux", () => {
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-01-04", title: "Veille de fête", isClosed: false, openingTime: "07:00", closingTime: "14:00", openingTime2: null, closingTime2: null },
    ];
    const result = resolveDayHours({ openingHours: WEEKLY, specialHours }, "2026-01-04", 0);
    expect(result.isSpecialDay).toBe(true);
    expect(result.specialDayTitle).toBe("Veille de fête");
    expect(result.source?.closingTime).toBe("14:00");
    expect(result.isExceptionalClosure).toBe(false);
  });

  it("palier 3 : sans horaire spécial, retombe sur l'horaire hebdomadaire normal du jour", () => {
    const result = resolveDayHours({ openingHours: WEEKLY, specialHours: [] }, "2026-01-04", 0);
    expect(result.isSpecialDay).toBe(false);
    expect(result.source?.openingTime).toBe("07:00");
    expect(result.source?.closingTime).toBe("22:00");
  });

  it("palier 4 : repli fermé (source=null) quand aucune donnée n'existe pour ce jour de semaine", () => {
    // WEEKLY ne contient que dayOfWeek=0 (dimanche) — on interroge un lundi (1).
    const result = resolveDayHours({ openingHours: WEEKLY, specialHours: [] }, "2026-01-05", 1);
    expect(result.source).toBeNull();
    expect(result.isSpecialDay).toBe(false);
    expect(result.isExceptionalClosure).toBe(false);
  });

  it("palier 4 (bis) : repli fermé quand la liste d'horaires est totalement vide", () => {
    const result = resolveDayHours({ openingHours: [], specialHours: [] }, "2026-01-05", 1);
    expect(result.source).toBeNull();
  });
});

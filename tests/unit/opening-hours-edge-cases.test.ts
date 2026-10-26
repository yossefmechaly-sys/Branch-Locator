import { describe, expect, it } from "vitest";

import { getBranchStatus } from "@/lib/opening-hours/status";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";

function israelTime(utc: [number, number, number, number, number]): Date {
  const [year, monthIndex, day, hour, minute] = utc;
  return new Date(Date.UTC(year, monthIndex, day, hour, minute));
}

const STANDARD_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 0, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
  { dayOfWeek: 5, isClosed: false, openingTime: "07:00", closingTime: "15:00", openingTime2: null, closingTime2: null },
];

/**
 * Tests de bout en bout (via `getBranchStatus()`, la fonction la plus
 * exposée du moteur) pour les cas limites explicitement demandés en §10/§11/§12 :
 * minuit, 23:59, changement de jour, données invalides, DST.
 */
describe("getBranchStatus — cas limites minuit / 23:59 (§10)", () => {
  it("est CLOSED pile à minuit (00:00), avant l'ouverture de 07:00", () => {
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 3, 22, 0]));
    expect(result.status).toBe("CLOSED");
  });

  it("est CLOSED à 23:59, après la fermeture de 22:00", () => {
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 21, 59]));
    expect(result.status).toBe("CLOSED");
  });

  it("bascule correctement de jour (samedi 23:59 → dimanche 00:00, jour ouvert)", () => {
    // Samedi 03/01/2026, 23:59 → aucun horaire pour samedi (absent de STANDARD_HOURS) → fermé.
    const saturdayEnd = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 3, 21, 59]));
    expect(saturdayEnd.status).toBe("CLOSED");
    expect(saturdayEnd.todayHours).toBeNull();

    // Dimanche 04/01/2026, 00:01 → jour ouvert, mais avant 07:00 → toujours fermé, avec horaires du jour.
    const sundayStart = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 3, 22, 1]));
    expect(sundayStart.status).toBe("CLOSED");
    expect(sundayStart.todayHours?.openingTime).toBe("07:00");
  });
});

describe("getBranchStatus — traversée de minuit non supportée (limite documentée, §10)", () => {
  it("un créneau saisi comme 22:00→00:00 (traversant minuit) est traité comme invalide/absent, jamais interprété fragilement", () => {
    const crossesMidnight: OpeningHoursEntry[] = [
      { dayOfWeek: 0, isClosed: false, openingTime: "22:00", closingTime: "00:00", openingTime2: null, closingTime2: null },
    ];
    // 23:00, qui « devrait » être dans le créneau si la traversée de minuit
    // était supportée : le moteur ne plante pas, mais retombe sur fermé,
    // conformément à la politique conservatrice (§12) et à la limite
    // documentée (§10 : pas de support des créneaux traversant minuit).
    const result = getBranchStatus({ openingHours: crossesMidnight, specialHours: [] }, israelTime([2026, 0, 4, 21, 0]));
    expect(result.status).toBe("CLOSED");
  });
});

describe("getBranchStatus — tolérance aux données invalides, bout en bout (§12)", () => {
  it("des horaires spéciaux avec une heure de fermeture manquante retombent sur fermé, sans planter", () => {
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-01-04", title: "Horaire mal saisi", isClosed: false, openingTime: "07:00", closingTime: null, openingTime2: null, closingTime2: null },
    ];
    expect(() =>
      getBranchStatus({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 0, 4, 8, 0]))
    ).not.toThrow();
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 0, 4, 8, 0]));
    expect(result.status).toBe("CLOSED");
  });

  it("un doublon d'entrées hebdomadaires pour le même jour ne fait pas planter le calcul et garde la première", () => {
    const duplicated: OpeningHoursEntry[] = [
      { dayOfWeek: 0, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
      { dayOfWeek: 0, isClosed: false, openingTime: "10:00", closingTime: "18:00", openingTime2: null, closingTime2: null },
    ];
    const result = getBranchStatus({ openingHours: duplicated, specialHours: [] }, israelTime([2026, 0, 4, 8, 0]));
    expect(result.todayHours?.openingTime).toBe("07:00");
  });

  it("une liste totalement vide et absence d'horaires spéciaux retombent sur fermé, jamais sur ouvert par défaut", () => {
    const result = getBranchStatus({ openingHours: [], specialHours: [] }, israelTime([2026, 0, 4, 8, 0]));
    expect(result.status).toBe("CLOSED");
    expect(result.todayHours).toBeNull();
  });
});

describe("getBranchStatus — passage à l'heure d'été/hiver (DST, §11)", () => {
  it("reste correct un vendredi de passage à l'heure d'été (27/03/2026)", () => {
    // Vendredi 27/03/2026, 10:00 heure d'Israël = 07:00 UTC (été, UTC+3).
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 2, 27, 7, 0]));
    expect(result.status).toBe("OPEN");
    expect(result.todayHours?.closingTime).toBe("15:00");
  });

  it("reste correct un dimanche juste après le retour à l'heure d'hiver (25/10/2026)", () => {
    // Dimanche 25/10/2026, 10:00 heure d'Israël = 08:00 UTC (hiver, UTC+2).
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 9, 25, 8, 0]));
    expect(result.status).toBe("OPEN");
    expect(result.todayHours?.closingTime).toBe("22:00");
  });
});

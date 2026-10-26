import { describe, expect, it } from "vitest";

import {
  addIsoDays,
  dayOfWeekForIsoDate,
  getIsraelNow,
  isValidTimeString,
  timeToMinutes,
} from "@/lib/opening-hours/timezone";

/**
 * Couvre §11 (fuseau Asia/Jerusalem via `Intl`, jamais `Date.getHours()`) et
 * les cas limites minuit/23:59/DST (§10/§11) au niveau de la fonction
 * fondatrice `getIsraelNow()`, dont dérive tout le reste du moteur.
 */
describe("getIsraelNow — fuseau Asia/Jerusalem (§2/§11)", () => {
  it("calcule jour de semaine, minutes depuis minuit et date ISO à partir d'un instant UTC", () => {
    // Dimanche 04/01/2026, 10:00 heure d'Israël = 08:00 UTC (hiver, UTC+2).
    const result = getIsraelNow(new Date(Date.UTC(2026, 0, 4, 8, 0)));
    expect(result).toEqual({ dayOfWeek: 0, minutesSinceMidnight: 10 * 60, isoDate: "2026-01-04" });
  });

  it("reste correct pile à minuit local (00:00)", () => {
    // Dimanche 04/01/2026, 00:00 heure d'Israël = 22:00 UTC la veille.
    const result = getIsraelNow(new Date(Date.UTC(2026, 0, 3, 22, 0)));
    expect(result.minutesSinceMidnight).toBe(0);
    expect(result.isoDate).toBe("2026-01-04");
    expect(result.dayOfWeek).toBe(0);
  });

  it("reste correct à 23:59 local, juste avant le changement de jour", () => {
    // Dimanche 04/01/2026, 23:59 heure d'Israël = 21:59 UTC.
    const result = getIsraelNow(new Date(Date.UTC(2026, 0, 4, 21, 59)));
    expect(result.minutesSinceMidnight).toBe(23 * 60 + 59);
    expect(result.isoDate).toBe("2026-01-04");
  });

  it("bascule correctement au jour suivant une minute plus tard (00:00 le lendemain)", () => {
    const result = getIsraelNow(new Date(Date.UTC(2026, 0, 4, 22, 0)));
    expect(result.minutesSinceMidnight).toBe(0);
    expect(result.isoDate).toBe("2026-01-05");
    expect(result.dayOfWeek).toBe(1);
  });

  it("reste correct un vendredi de passage à l'heure d'été (27/03/2026, DST+1h, §11)", () => {
    // Vendredi 27/03/2026, 10:00 heure d'Israël = 07:00 UTC (été, UTC+3).
    const result = getIsraelNow(new Date(Date.UTC(2026, 2, 27, 7, 0)));
    expect(result).toEqual({ dayOfWeek: 5, minutesSinceMidnight: 10 * 60, isoDate: "2026-03-27" });
  });

  it("reste correct un dimanche juste après le retour à l'heure d'hiver (25/10/2026, §11)", () => {
    // Dimanche 25/10/2026, 10:00 heure d'Israël = 08:00 UTC (hiver, UTC+2, déjà repassé).
    const result = getIsraelNow(new Date(Date.UTC(2026, 9, 25, 8, 0)));
    expect(result).toEqual({ dayOfWeek: 0, minutesSinceMidnight: 10 * 60, isoDate: "2026-10-25" });
  });
});

describe("addIsoDays — arithmétique calendaire insensible au DST (§8/§11)", () => {
  it("ajoute un jour simple", () => {
    expect(addIsoDays("2026-01-04", 1)).toBe("2026-01-05");
  });

  it("traverse un changement de mois", () => {
    expect(addIsoDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("traverse un changement d'année", () => {
    expect(addIsoDays("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("reste exactement +1 jour calendaire à travers le passage à l'heure d'été (26→27 mars 2026)", () => {
    // Ce jour-là, l'écart réel en heures entre les deux minuits UTC-relatifs
    // n'est PAS 24h (DST) — mais l'arithmétique est purement calendaire
    // (année/mois/jour en UTC), donc le résultat reste exactement +1 jour.
    expect(addIsoDays("2026-03-26", 1)).toBe("2026-03-27");
  });

  it("reste exactement +1 jour calendaire à travers le retour à l'heure d'hiver (24→25 octobre 2026)", () => {
    expect(addIsoDays("2026-10-24", 1)).toBe("2026-10-25");
  });

  it("accepte un décalage négatif", () => {
    expect(addIsoDays("2026-01-05", -1)).toBe("2026-01-04");
  });
});

describe("dayOfWeekForIsoDate (§11)", () => {
  it("retourne le bon jour de semaine pour des dates connues", () => {
    expect(dayOfWeekForIsoDate("2026-01-04")).toBe(0); // dimanche
    expect(dayOfWeekForIsoDate("2026-01-09")).toBe(5); // vendredi
    expect(dayOfWeekForIsoDate("2026-01-10")).toBe(6); // samedi
    expect(dayOfWeekForIsoDate("2026-03-27")).toBe(5); // vendredi, DST
    expect(dayOfWeekForIsoDate("2026-10-25")).toBe(0); // dimanche, sortie DST
  });
});

describe("timeToMinutes / isValidTimeString — tolérance aux données invalides (§12)", () => {
  it("convertit une heure valide", () => {
    expect(timeToMinutes("07:00")).toBe(7 * 60);
    expect(timeToMinutes("23:59")).toBe(23 * 60 + 59);
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("retourne null pour une entrée absente", () => {
    expect(timeToMinutes(null)).toBeNull();
    expect(timeToMinutes(undefined)).toBeNull();
  });

  it("retourne null pour un format mal formé, jamais NaN", () => {
    expect(timeToMinutes("7:00")).toBeNull();
    expect(timeToMinutes("25:00")).toBeNull();
    expect(timeToMinutes("12:60")).toBeNull();
    expect(timeToMinutes("not-a-time")).toBeNull();
    expect(timeToMinutes("")).toBeNull();
  });

  it("isValidTimeString concorde exactement avec timeToMinutes", () => {
    expect(isValidTimeString("07:00")).toBe(true);
    expect(isValidTimeString("25:00")).toBe(false);
    expect(isValidTimeString(null)).toBe(false);
    expect(isValidTimeString(undefined)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { HOURS_COLUMN_KEYS, parseHoursCell, parseWeeklyHours } from "@/lib/import/hours-format";

describe("parseHoursCell (Phase 10, §29)", () => {
  it("une cellule vide donne un jour fermé", () => {
    const result = parseHoursCell("");
    expect(result).toEqual({ ok: true, entry: { isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null } });
  });

  it("un seul créneau HH:mm-HH:mm", () => {
    const result = parseHoursCell("09:00-18:00");
    expect(result).toEqual({
      ok: true,
      entry: { isClosed: false, openingTime: "09:00", closingTime: "18:00", openingTime2: null, closingTime2: null },
    });
  });

  it("deux créneaux séparés par une virgule", () => {
    const result = parseHoursCell("09:00-13:00,16:00-19:00");
    expect(result).toEqual({
      ok: true,
      entry: { isClosed: false, openingTime: "09:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "19:00" },
    });
  });

  it("tolère les espaces autour des créneaux", () => {
    const result = parseHoursCell(" 09:00-13:00 , 16:00-19:00 ");
    expect(result.ok).toBe(true);
  });

  it("rejette un format non reconnu", () => {
    expect(parseHoursCell("ouvert").ok).toBe(false);
    expect(parseHoursCell("9h-18h").ok).toBe(false);
    expect(parseHoursCell("09:00").ok).toBe(false);
  });

  it("rejette plus de deux créneaux", () => {
    expect(parseHoursCell("09:00-12:00,13:00-15:00,16:00-18:00").ok).toBe(false);
  });

  it("rejette une heure hors bornes (25:00, minutes >59)", () => {
    expect(parseHoursCell("25:00-26:00").ok).toBe(false);
    expect(parseHoursCell("09:70-10:00").ok).toBe(false);
  });
});

describe("parseWeeklyHours (Phase 10, §29)", () => {
  it("renvoie entries=null si aucune colonne d'horaires n'existe dans l'en-tête (jamais un tableau partiel)", () => {
    const result = parseWeeklyHours({}, false);
    expect(result).toEqual({ ok: true, entries: null });
  });

  it("construit un tableau de 7 entrées quand les colonnes existent, dans l'ordre dayOfWeek 0..6", () => {
    const row: Record<string, string> = {
      hours_dim: "",
      hours_lun: "09:00-18:00",
      hours_mar: "09:00-18:00",
      hours_mer: "09:00-18:00",
      hours_jeu: "09:00-18:00",
      hours_ven: "09:00-14:00",
      hours_sam: "",
    };
    const result = parseWeeklyHours(row, true);
    expect(result.ok).toBe(true);
    if (result.ok && result.entries) {
      expect(result.entries).toHaveLength(7);
      expect(result.entries.map((e) => e.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(result.entries[0].isClosed).toBe(true); // dimanche vide → fermé
      expect(result.entries[1]).toEqual({ dayOfWeek: 1, isClosed: false, openingTime: "09:00", closingTime: "18:00", openingTime2: null, closingTime2: null });
    }
  });

  it("agrège toutes les erreurs de cellule, avec le nom de colonne en préfixe", () => {
    const row: Record<string, string> = { hours_dim: "invalide", hours_lun: "09:00-18:00" };
    const result = parseWeeklyHours(row, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain("hours_dim");
    }
  });

  it("HOURS_COLUMN_KEYS contient exactement 7 colonnes", () => {
    expect(HOURS_COLUMN_KEYS).toHaveLength(7);
  });
});

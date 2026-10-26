import { describe, expect, it } from "vitest";

import { normalizeOpeningHours } from "@/lib/opening-hours/normalize";
import type { OpeningHoursEntry } from "@/types/opening-hours";

function entry(overrides: Partial<OpeningHoursEntry> & { dayOfWeek: OpeningHoursEntry["dayOfWeek"] }): OpeningHoursEntry {
  return {
    isClosed: false,
    openingTime: null,
    closingTime: null,
    openingTime2: null,
    closingTime2: null,
    ...overrides,
  };
}

/**
 * Couvre §12 (tolérance aux données invalides — jamais de plantage, politique
 * conservatrice « fermé/indisponible ») pour `normalizeOpeningHours()`.
 */
describe("normalizeOpeningHours — tolérance aux données invalides (§12)", () => {
  it("conserve un jour ouvert valide, avec ses deux créneaux si présents", () => {
    const result = normalizeOpeningHours([
      entry({ dayOfWeek: 1, openingTime: "07:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "22:00" }),
    ]);
    expect(result).toEqual([
      entry({ dayOfWeek: 1, openingTime: "07:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "22:00" }),
    ]);
  });

  it("retire un créneau dont l'heure de fermeture est manquante (§12)", () => {
    const result = normalizeOpeningHours([entry({ dayOfWeek: 0, openingTime: "07:00", closingTime: null })]);
    expect(result[0].openingTime).toBeNull();
    expect(result[0].closingTime).toBeNull();
  });

  it("retire un créneau au format mal formé", () => {
    const result = normalizeOpeningHours([entry({ dayOfWeek: 0, openingTime: "7h00", closingTime: "22:00" })]);
    expect(result[0].openingTime).toBeNull();
    expect(result[0].closingTime).toBeNull();
  });

  it("retire un créneau inversé (fermeture avant ouverture)", () => {
    const result = normalizeOpeningHours([entry({ dayOfWeek: 0, openingTime: "22:00", closingTime: "07:00" })]);
    expect(result[0].openingTime).toBeNull();
    expect(result[0].closingTime).toBeNull();
  });

  it("retire un créneau dont l'ouverture égale la fermeture (documente la limite : pas de traversée de minuit, §10)", () => {
    // Un magasin « ouvert jusqu'à minuit » saisi comme 22:00→00:00 serait
    // interprété comme fermeture ≤ ouverture (0 < 22*60) et donc retiré : le
    // modèle actuel ne supporte pas les créneaux traversant minuit — c'est une
    // limite documentée plutôt qu'une implémentation fragile (§10).
    const result = normalizeOpeningHours([entry({ dayOfWeek: 0, openingTime: "22:00", closingTime: "00:00" })]);
    expect(result[0].openingTime).toBeNull();
    expect(result[0].closingTime).toBeNull();
  });

  it("ne retire que le second créneau invalide, en gardant le premier valide", () => {
    const result = normalizeOpeningHours([
      entry({ dayOfWeek: 0, openingTime: "07:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "13:30" }),
    ]);
    expect(result[0].openingTime).toBe("07:00");
    expect(result[0].closingTime).toBe("13:00");
    expect(result[0].openingTime2).toBeNull();
    expect(result[0].closingTime2).toBeNull();
  });

  it("force tous les horaires à null quand isClosed=true, même si des heures étaient présentes (donnée incohérente)", () => {
    const result = normalizeOpeningHours([
      entry({ dayOfWeek: 6, isClosed: true, openingTime: "07:00", closingTime: "22:00" }),
    ]);
    expect(result[0]).toEqual(entry({ dayOfWeek: 6, isClosed: true }));
  });

  it("déduplique par dayOfWeek en gardant la PREMIÈRE occurrence", () => {
    const result = normalizeOpeningHours([
      entry({ dayOfWeek: 1, openingTime: "07:00", closingTime: "13:00" }),
      entry({ dayOfWeek: 1, openingTime: "09:00", closingTime: "18:00" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].openingTime).toBe("07:00");
    expect(result[0].closingTime).toBe("13:00");
  });

  it("ne rajoute jamais un jour absent de la liste d'entrée", () => {
    const result = normalizeOpeningHours([entry({ dayOfWeek: 0 })]);
    expect(result).toHaveLength(1);
    expect(result.find((e) => e.dayOfWeek === 1)).toBeUndefined();
  });

  it("tolère une liste vide", () => {
    expect(normalizeOpeningHours([])).toEqual([]);
  });
});

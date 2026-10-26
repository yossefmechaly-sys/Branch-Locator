import { describe, expect, it } from "vitest";

import { buildOpeningHoursSpecification } from "@/lib/seo/opening-hours-schema";
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

describe("buildOpeningHoursSpecification (§24 Phase 8)", () => {
  it("produit une entrée par jour ouvert, avec l'URI Schema.org du jour correcte", () => {
    const specs = buildOpeningHoursSpecification([
      entry({ dayOfWeek: 0, openingTime: "07:00", closingTime: "22:00" }),
    ]);

    expect(specs).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: "https://schema.org/Sunday", opens: "07:00", closes: "22:00" },
    ]);
  });

  it("un jour fermé ne produit AUCUNE entrée", () => {
    const specs = buildOpeningHoursSpecification([entry({ dayOfWeek: 5, isClosed: true })]);
    expect(specs).toEqual([]);
  });

  it("un jour absent de la liste ne produit aucune entrée (jamais d'horaire inventé)", () => {
    expect(buildOpeningHoursSpecification([])).toEqual([]);
  });

  it("un jour à coupure méridienne (deux créneaux) produit DEUX OpeningHoursSpecification", () => {
    const specs = buildOpeningHoursSpecification([
      entry({
        dayOfWeek: 4,
        openingTime: "08:00",
        closingTime: "13:00",
        openingTime2: "16:00",
        closingTime2: "19:00",
      }),
    ]);

    expect(specs).toHaveLength(2);
    expect(specs[0]).toMatchObject({ opens: "08:00", closes: "13:00" });
    expect(specs[1]).toMatchObject({ opens: "16:00", closes: "19:00" });
    expect(specs[0].dayOfWeek).toBe(specs[1].dayOfWeek);
  });

  it("un créneau invalide (fermeture avant ouverture) est silencieusement omis, jamais publié tel quel", () => {
    const specs = buildOpeningHoursSpecification([
      entry({ dayOfWeek: 2, openingTime: "22:00", closingTime: "07:00" }),
    ]);
    expect(specs).toEqual([]);
  });

  it("plusieurs jours ouverts produisent une entrée chacun, dans l'ordre des données", () => {
    const specs = buildOpeningHoursSpecification([
      entry({ dayOfWeek: 0, openingTime: "07:00", closingTime: "22:00" }),
      entry({ dayOfWeek: 1, openingTime: "07:00", closingTime: "22:00" }),
      entry({ dayOfWeek: 6, isClosed: true }),
    ]);

    expect(specs.map((spec) => spec.dayOfWeek)).toEqual([
      "https://schema.org/Sunday",
      "https://schema.org/Monday",
    ]);
  });
});

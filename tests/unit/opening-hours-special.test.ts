import { describe, expect, it } from "vitest";

import { resolveSpecialOpeningHours } from "@/lib/opening-hours/special";
import type { SpecialHoursEntry } from "@/types/opening-hours";

function special(overrides: Partial<SpecialHoursEntry> & { date: string }): SpecialHoursEntry {
  return {
    title: null,
    isClosed: false,
    openingTime: null,
    closingTime: null,
    openingTime2: null,
    closingTime2: null,
    ...overrides,
  };
}

/**
 * Couvre §4/§12 pour `resolveSpecialOpeningHours()` — la source qui prévaut
 * sur les horaires hebdomadaires quand elle existe pour la date demandée.
 */
describe("resolveSpecialOpeningHours", () => {
  it("retourne null quand aucune entrée ne correspond à la date", () => {
    const result = resolveSpecialOpeningHours(
      [special({ date: "2026-09-12", title: "Roch Hachana", isClosed: true })],
      "2026-09-11"
    );
    expect(result).toBeNull();
  });

  it("retourne l'entrée correspondant exactement à la date demandée", () => {
    const entry = special({ date: "2026-09-13", title: "Veille de Kippour", isClosed: false, openingTime: "07:00", closingTime: "14:00" });
    const result = resolveSpecialOpeningHours([entry], "2026-09-13");
    expect(result?.title).toBe("Veille de Kippour");
    expect(result?.openingTime).toBe("07:00");
  });

  it("garde la PREMIÈRE entrée en cas de doublon de date (déterministe)", () => {
    const result = resolveSpecialOpeningHours(
      [
        special({ date: "2026-09-13", title: "Premier" }),
        special({ date: "2026-09-13", title: "Second" }),
      ],
      "2026-09-13"
    );
    expect(result?.title).toBe("Premier");
  });

  it("assainit les heures invalides de l'entrée spéciale trouvée (§12, mêmes règles que l'horaire hebdo)", () => {
    const result = resolveSpecialOpeningHours(
      [special({ date: "2026-09-13", openingTime: "14:00", closingTime: "07:00" })],
      "2026-09-13"
    );
    expect(result?.openingTime).toBeNull();
    expect(result?.closingTime).toBeNull();
  });

  it("conserve isClosed=true tel quel, avec des horaires nettoyés à null", () => {
    const result = resolveSpecialOpeningHours(
      [special({ date: "2026-09-12", title: "Roch Hachana", isClosed: true })],
      "2026-09-12"
    );
    expect(result?.isClosed).toBe(true);
    expect(result?.openingTime).toBeNull();
  });

  it("tolère une liste vide", () => {
    expect(resolveSpecialOpeningHours([], "2026-09-13")).toBeNull();
  });
});

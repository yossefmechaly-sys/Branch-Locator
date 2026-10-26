import { describe, expect, it } from "vitest";

import {
  addIsoDays,
  inclusiveDayCount,
  jerusalemDateRangeToUtc,
  jerusalemIsoDate,
  jerusalemMidnightToUtc,
  previousPeriod,
} from "@/lib/analytics/timezone";

/**
 * Fuseau horaire des statistiques (Phase 10, §18) — TOUJOURS Asia/Jerusalem,
 * jamais UTC. Ces tests couvrent explicitement les deux régimes d'heure
 * d'été israélienne (UTC+2 en hiver, UTC+3 en été) pour vérifier que la
 * conversion s'adapte réellement, plutôt qu'un décalage fixe codé en dur.
 */
describe("jerusalemIsoDate / jerusalemMidnightToUtc (Phase 10, §18)", () => {
  it("convertit un instant UTC en date calendaire à Jérusalem (été, UTC+3)", () => {
    // 2026-08-30T22:30:00Z → 2026-08-31 01:30 à Jérusalem (été).
    expect(jerusalemIsoDate(new Date("2026-08-30T22:30:00.000Z"))).toBe("2026-08-31");
  });

  it("convertit un instant UTC en date calendaire à Jérusalem (hiver, UTC+2)", () => {
    // 2026-01-15T21:30:00Z → 2026-01-15 23:30 à Jérusalem (hiver) — encore le même jour.
    expect(jerusalemIsoDate(new Date("2026-01-15T21:30:00.000Z"))).toBe("2026-01-15");
    // 2026-01-15T22:30:00Z → 2026-01-16 00:30 à Jérusalem — jour suivant.
    expect(jerusalemIsoDate(new Date("2026-01-15T22:30:00.000Z"))).toBe("2026-01-16");
  });

  it("jerusalemMidnightToUtc est l'inverse exact de jerusalemIsoDate", () => {
    for (const isoDate of ["2026-01-15", "2026-08-31", "2026-12-25"]) {
      const utcMidnight = jerusalemMidnightToUtc(isoDate);
      expect(jerusalemIsoDate(utcMidnight)).toBe(isoDate);
      // Une minute avant doit encore appartenir à la veille.
      expect(jerusalemIsoDate(new Date(utcMidnight.getTime() - 60_000))).toBe(addIsoDays(isoDate, -1));
    }
  });
});

describe("jerusalemDateRangeToUtc (Phase 10, §18)", () => {
  it("produit une borne [gte, lt) couvrant exactement les jours demandés, jamais UTC naïf", () => {
    const range = jerusalemDateRangeToUtc("2026-08-30", "2026-08-31");
    expect(jerusalemIsoDate(range.gte)).toBe("2026-08-30");
    // La borne haute est exclusive et correspond au tout début du jour SUIVANT le dernier jour demandé.
    expect(jerusalemIsoDate(range.lt)).toBe("2026-09-01");
    expect(jerusalemIsoDate(new Date(range.lt.getTime() - 1))).toBe("2026-08-31");
  });
});

describe("inclusiveDayCount / previousPeriod (Phase 10, §17)", () => {
  it("compte les jours de façon inclusive", () => {
    expect(inclusiveDayCount("2026-08-25", "2026-08-25")).toBe(1);
    expect(inclusiveDayCount("2026-08-25", "2026-08-31")).toBe(7);
  });

  it("calcule une période précédente de même durée, immédiatement adjacente, sans chevauchement", () => {
    const previous = previousPeriod("2026-08-25", "2026-08-31");
    expect(previous).toEqual({ start: "2026-08-18", end: "2026-08-24" });
    expect(inclusiveDayCount(previous.start, previous.end)).toBe(7);
  });

  it("gère une période d'un seul jour", () => {
    expect(previousPeriod("2026-08-25", "2026-08-25")).toEqual({ start: "2026-08-24", end: "2026-08-24" });
  });
});

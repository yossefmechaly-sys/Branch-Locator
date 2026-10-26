import { describe, expect, it } from "vitest";

import { isValidIsoDateString, parsePeriodKey, resolvePeriodRange } from "@/lib/analytics/period";

describe("parsePeriodKey (Phase 10, §10)", () => {
  it("accepte les quatre valeurs connues", () => {
    expect(parsePeriodKey("today")).toBe("today");
    expect(parsePeriodKey("7d")).toBe("7d");
    expect(parsePeriodKey("30d")).toBe("30d");
    expect(parsePeriodKey("custom")).toBe("custom");
  });

  it("retombe sur '7d' pour toute valeur inconnue ou absente (jamais une exception)", () => {
    expect(parsePeriodKey(undefined)).toBe("7d");
    expect(parsePeriodKey(null)).toBe("7d");
    expect(parsePeriodKey("")).toBe("7d");
    expect(parsePeriodKey("1y")).toBe("7d");
  });
});

describe("isValidIsoDateString", () => {
  it("accepte le format YYYY-MM-DD", () => {
    expect(isValidIsoDateString("2026-08-31")).toBe(true);
  });

  it("rejette un format incorrect ou une valeur absente", () => {
    expect(isValidIsoDateString("31/08/2026")).toBe(false);
    expect(isValidIsoDateString("2026-8-31")).toBe(false);
    expect(isValidIsoDateString(undefined)).toBe(false);
    expect(isValidIsoDateString(null)).toBe(false);
    expect(isValidIsoDateString("")).toBe(false);
  });
});

describe("resolvePeriodRange (Phase 10, §10)", () => {
  const TODAY = "2026-08-31";

  it("'today' renvoie le même jour pour startDate et endDate", () => {
    expect(resolvePeriodRange("today", TODAY)).toEqual({ startDate: TODAY, endDate: TODAY });
  });

  it("'7d' couvre 7 jours calendaires se terminant aujourd'hui", () => {
    expect(resolvePeriodRange("7d", TODAY)).toEqual({ startDate: "2026-08-25", endDate: TODAY });
  });

  it("'30d' couvre 30 jours calendaires se terminant aujourd'hui", () => {
    expect(resolvePeriodRange("30d", TODAY)).toEqual({ startDate: "2026-08-02", endDate: TODAY });
  });

  it("'custom' utilise les bornes fournies quand elles sont valides", () => {
    expect(resolvePeriodRange("custom", TODAY, { start: "2026-08-01", end: "2026-08-15" })).toEqual({
      startDate: "2026-08-01",
      endDate: "2026-08-15",
    });
  });

  it("'custom' échange les bornes si start est postérieur à end (jamais une plage à l'envers)", () => {
    expect(resolvePeriodRange("custom", TODAY, { start: "2026-08-15", end: "2026-08-01" })).toEqual({
      startDate: "2026-08-01",
      endDate: "2026-08-15",
    });
  });

  it("'custom' retombe sur les 7 derniers jours si les bornes sont absentes ou invalides", () => {
    expect(resolvePeriodRange("custom", TODAY, {})).toEqual({ startDate: "2026-08-25", endDate: TODAY });
    expect(resolvePeriodRange("custom", TODAY, { start: "not-a-date", end: "also-not" })).toEqual({
      startDate: "2026-08-25",
      endDate: TODAY,
    });
  });

  it("'custom' retombe sur une borne individuelle invalide sans perdre l'autre borne valide", () => {
    expect(resolvePeriodRange("custom", TODAY, { start: "2026-08-01", end: "invalid" })).toEqual({
      startDate: "2026-08-01",
      endDate: TODAY,
    });
  });
});

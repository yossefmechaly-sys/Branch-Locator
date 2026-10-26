import { describe, expect, it } from "vitest";

import { openingHoursEntrySchema, slugSchema } from "@/lib/validators/common";
import { branchInputSchema, specialOpeningHoursInputSchema } from "@/lib/validators/branch";

/**
 * `openingHoursEntrySchema`/`specialOpeningHoursInputSchema` (Phase 9, §5/§6)
 * — interdiction explicite des créneaux traversant minuit, DISTINCTE du
 * repli silencieux du moteur public (`lib/opening-hours/normalize.ts`) : ici,
 * une saisie invalide doit être REFUSÉE avec une erreur, jamais acceptée
 * puis silencieusement corrigée.
 */
describe("openingHoursEntrySchema (Phase 9, §5)", () => {
  it("accepte un jour fermé sans horaires", () => {
    const result = openingHoursEntrySchema.safeParse({
      dayOfWeek: 6,
      isClosed: true,
      openingTime: null,
      closingTime: null,
      openingTime2: null,
      closingTime2: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepte un créneau unique standard (08:00–20:00)", () => {
    const result = openingHoursEntrySchema.safeParse({
      dayOfWeek: 0,
      isClosed: false,
      openingTime: "08:00",
      closingTime: "20:00",
      openingTime2: null,
      closingTime2: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un créneau traversant minuit (closingTime <= openingTime)", () => {
    const result = openingHoursEntrySchema.safeParse({
      dayOfWeek: 0,
      isClosed: false,
      openingTime: "22:00",
      closingTime: "02:00",
      openingTime2: null,
      closingTime2: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejette closingTime === openingTime (créneau de durée nulle)", () => {
    const result = openingHoursEntrySchema.safeParse({
      dayOfWeek: 0,
      isClosed: false,
      openingTime: "08:00",
      closingTime: "08:00",
      openingTime2: null,
      closingTime2: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepte deux créneaux valides (coupure méridienne)", () => {
    const result = openingHoursEntrySchema.safeParse({
      dayOfWeek: 0,
      isClosed: false,
      openingTime: "07:00",
      closingTime: "13:30",
      openingTime2: "16:00",
      closingTime2: "22:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un second créneau qui chevauche ou précède le premier", () => {
    const result = openingHoursEntrySchema.safeParse({
      dayOfWeek: 0,
      isClosed: false,
      openingTime: "07:00",
      closingTime: "13:30",
      openingTime2: "12:00",
      closingTime2: "20:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un second créneau lui-même traversant minuit", () => {
    const result = openingHoursEntrySchema.safeParse({
      dayOfWeek: 0,
      isClosed: false,
      openingTime: "07:00",
      closingTime: "13:00",
      openingTime2: "23:00",
      closingTime2: "01:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("specialOpeningHoursInputSchema (Phase 9, §6)", () => {
  it("accepte une fermeture exceptionnelle complète", () => {
    const result = specialOpeningHoursInputSchema.safeParse({
      date: "2026-09-11",
      title: "Veille de Rosh Hashana",
      isClosed: true,
      openingTime: null,
      closingTime: null,
      openingTime2: null,
      closingTime2: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejette également un créneau traversant minuit pour une date exceptionnelle", () => {
    const result = specialOpeningHoursInputSchema.safeParse({
      date: "2026-09-11",
      title: "Nocturne exceptionnelle",
      isClosed: false,
      openingTime: "20:00",
      closingTime: "01:00",
      openingTime2: null,
      closingTime2: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("branchInputSchema (Phase 9, §4)", () => {
  const heTranslation = {
    locale: "he" as const,
    displayName: "מעיין 2000 – רמות",
    description: null,
    seoTitle: null,
    seoDescription: null,
  };

  function baseBranch(overrides: Record<string, unknown> = {}) {
    return {
      slug: "jerusalem-ramot",
      branchCode: "RAM-01",
      cityId: "city-1",
      district: null,
      address: "Rehov Ramot 1",
      postalCode: null,
      latitude: 31.8,
      longitude: 35.2,
      phone: null,
      email: null,
      whatsappNumber: null,
      whatsappGroupUrl: null,
      wazeUrlOverride: null,
      mainImage: null,
      isActive: true,
      sortOrder: 0,
      serviceIds: [],
      openingHours: [],
      specialHours: [],
      images: [],
      translations: [heTranslation],
      ...overrides,
    };
  }

  it("accepte un magasin avec uniquement la traduction hébreu", () => {
    expect(branchInputSchema.safeParse(baseBranch()).success).toBe(true);
  });

  it("rejette un magasin sans traduction hébreu (§4, obligatoire)", () => {
    const result = branchInputSchema.safeParse(
      baseBranch({ translations: [{ locale: "en", displayName: "Ramot Branch", description: null, seoTitle: null, seoDescription: null }] })
    );
    expect(result.success).toBe(false);
  });

  it("rejette une latitude hors plage", () => {
    expect(branchInputSchema.safeParse(baseBranch({ latitude: 200 })).success).toBe(false);
  });
});

describe("slugSchema (indépendance de la langue, §4)", () => {
  it("accepte un slug en minuscules avec tirets", () => {
    expect(slugSchema.safeParse("jerusalem-ramot").success).toBe(true);
  });

  it("rejette les majuscules, espaces et caractères accentués", () => {
    expect(slugSchema.safeParse("Jerusalem Ramot").success).toBe(false);
    expect(slugSchema.safeParse("jérusalem-ramot").success).toBe(false);
  });
});

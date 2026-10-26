import { describe, expect, it } from "vitest";

import { computeTranslationStatus } from "@/lib/admin/translation-status";

describe("computeTranslationStatus (Phase 9, §16)", () => {
  it("marque une langue absente de la liste comme incomplète", () => {
    const status = computeTranslationStatus(
      [{ locale: "he", title: "מבצע" }],
      (t) => t.title.trim().length > 0
    );
    expect(status.he).toBe(true);
    expect(status.en).toBe(false);
    expect(status.ru).toBe(false);
  });

  it("marque une langue présente mais vide comme incomplète (§16 : « RU ! »)", () => {
    const status = computeTranslationStatus(
      [
        { locale: "he", title: "מבצע" },
        { locale: "ru", title: "   " },
      ],
      (t) => t.title.trim().length > 0
    );
    expect(status.he).toBe(true);
    expect(status.ru).toBe(false);
  });

  it("couvre les cinq langues même si aucune traduction n'est fournie", () => {
    const status = computeTranslationStatus<{ locale: "he" }>([], () => true);
    expect(Object.keys(status).sort()).toEqual(["en", "es", "fr", "he", "ru"]);
    expect(Object.values(status).every((v) => v === false)).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildBranchHreflangAlternates,
  buildBranchPath,
  buildBranchUrl,
  buildLocaleHreflangAlternates,
} from "@/lib/seo/branch-urls";

describe("lib/seo/branch-urls (§6/§19/§20 Phase 8)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://maayan2000.co.il");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("buildBranchPath préfixe la locale sans jamais modifier le slug", () => {
    expect(buildBranchPath("fr", "jerusalem-ramot")).toBe("/fr/branches/jerusalem-ramot");
    expect(buildBranchPath("he", "jerusalem-ramot")).toBe("/he/branches/jerusalem-ramot");
  });

  it("buildBranchUrl compose une URL absolue à partir du domaine configuré", () => {
    expect(buildBranchUrl("en", "tel-aviv-center")).toBe(
      "https://maayan2000.co.il/en/branches/tel-aviv-center"
    );
  });

  it("buildBranchHreflangAlternates fournit une entrée par langue supportée, avec le même slug partout", () => {
    const alternates = buildBranchHreflangAlternates("jerusalem-ramot");

    expect(alternates.he).toBe("https://maayan2000.co.il/he/branches/jerusalem-ramot");
    expect(alternates.en).toBe("https://maayan2000.co.il/en/branches/jerusalem-ramot");
    expect(alternates.ru).toBe("https://maayan2000.co.il/ru/branches/jerusalem-ramot");
    expect(alternates.fr).toBe("https://maayan2000.co.il/fr/branches/jerusalem-ramot");
    expect(alternates.es).toBe("https://maayan2000.co.il/es/branches/jerusalem-ramot");
  });

  it("x-default pointe toujours vers la version hébraïque (langue de référence), jamais une autre langue", () => {
    const alternates = buildBranchHreflangAlternates("jerusalem-ramot");
    expect(alternates["x-default"]).toBe(alternates.he);
  });

  // Phase 11, §16 (régression — correctif défaut réel, audit SEO) :
  // `buildLocaleHreflangAlternates()` généralise `buildBranchHreflangAlternates()`
  // à une page localisée quelconque (ex. le Store Locator `/branches`), après
  // qu'un audit ait trouvé cette page sans AUCUN `alternates.languages` propre
  // (héritant du layout racine, chemins faux, `x-default` absent).
  describe("buildLocaleHreflangAlternates (Phase 11, §16 régression)", () => {
    it("préfixe chaque locale au chemin donné, pour les 5 langues supportées", () => {
      const alternates = buildLocaleHreflangAlternates("/branches");

      expect(alternates.he).toBe("https://maayan2000.co.il/he/branches");
      expect(alternates.en).toBe("https://maayan2000.co.il/en/branches");
      expect(alternates.fr).toBe("https://maayan2000.co.il/fr/branches");
      expect(alternates.ru).toBe("https://maayan2000.co.il/ru/branches");
      expect(alternates.es).toBe("https://maayan2000.co.il/es/branches");
    });

    it("x-default pointe vers la version hébraïque, même règle que buildBranchHreflangAlternates", () => {
      const alternates = buildLocaleHreflangAlternates("/branches");
      expect(alternates["x-default"]).toBe(alternates.he);
    });
  });
});

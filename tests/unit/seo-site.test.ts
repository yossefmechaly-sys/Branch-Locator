import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl } from "@/lib/seo/site";

describe("getSiteUrl (§27 Phase 8)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lit NEXT_PUBLIC_SITE_URL et retire un éventuel slash final", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://maayan2000.co.il/");
    expect(getSiteUrl()).toBe("https://maayan2000.co.il");
  });

  it("laisse l'URL inchangée quand elle n'a pas de slash final", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://maayan2000.co.il");
    expect(getSiteUrl()).toBe("https://maayan2000.co.il");
  });

  it("retombe sur http://localhost:3000 quand la variable est absente — jamais un domaine de staging codé en dur", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("retombe sur le port par défaut de next dev quand la variable ne contient que des espaces", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "   ");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

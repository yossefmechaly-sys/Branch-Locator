import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBranchMetadata, DEFAULT_OG_IMAGE_PATH, type BranchMetadataInput } from "@/lib/seo/metadata";

function makeInput(overrides: Partial<BranchMetadataInput> = {}): BranchMetadataInput {
  return {
    locale: "fr",
    slug: "jerusalem-ramot",
    seoTitle: null,
    seoDescription: null,
    description: null,
    mainImage: null,
    fallbackTitle: "Maayan 2000 – Ramot Jérusalem – Horaires, adresse et itinéraire",
    fallbackDescription: "Tout sur le magasin Maayan 2000 de Ramot à Jérusalem.",
    ...overrides,
  };
}

describe("buildBranchMetadata (§5/§18/§19/§20/§28 Phase 8)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://maayan2000.co.il");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("utilise seoTitle/seoDescription (traductions DB) en priorité quand présents", () => {
    const metadata = buildBranchMetadata(
      makeInput({ seoTitle: "Titre SEO dédié", seoDescription: "Description SEO dédiée" })
    );
    expect(metadata.title).toBe("Titre SEO dédié");
    expect(metadata.description).toBe("Description SEO dédiée");
  });

  it("retombe sur fallbackTitle quand seoTitle est absent", () => {
    const metadata = buildBranchMetadata(makeInput());
    expect(metadata.title).toBe(
      "Maayan 2000 – Ramot Jérusalem – Horaires, adresse et itinéraire"
    );
  });

  it("retombe sur description (traduction) quand seoDescription est absente mais description présente", () => {
    const metadata = buildBranchMetadata(makeInput({ description: "Description générale du magasin." }));
    expect(metadata.description).toBe("Description générale du magasin.");
  });

  it("retombe sur fallbackDescription quand ni seoDescription ni description ne sont disponibles", () => {
    const metadata = buildBranchMetadata(makeInput());
    expect(metadata.description).toBe("Tout sur le magasin Maayan 2000 de Ramot à Jérusalem.");
  });

  it("canonical est propre à CETTE langue, jamais toutes les langues vers l'hébreu (§19)", () => {
    const metadata = buildBranchMetadata(makeInput({ locale: "fr" }));
    expect(metadata.alternates?.canonical).toBe("https://maayan2000.co.il/fr/branches/jerusalem-ramot");
  });

  it("alternates.languages inclut x-default vers la version hébraïque (§20)", () => {
    const metadata = buildBranchMetadata(makeInput());
    const languages = metadata.alternates?.languages as Record<string, string>;
    expect(languages["x-default"]).toBe("https://maayan2000.co.il/he/branches/jerusalem-ramot");
    expect(languages.he).toBe("https://maayan2000.co.il/he/branches/jerusalem-ramot");
  });

  it("utilise l'image générique de repli quand aucune photo n'est disponible (§28)", () => {
    const metadata = buildBranchMetadata(makeInput({ mainImage: null }));
    const openGraphImages = metadata.openGraph?.images as { url: string }[];
    expect(openGraphImages[0].url).toBe(`https://maayan2000.co.il${DEFAULT_OG_IMAGE_PATH}`);
  });

  it("rend absolue une image relative du magasin", () => {
    const metadata = buildBranchMetadata(makeInput({ mainImage: "/uploads/branch-42.jpg" }));
    const openGraphImages = metadata.openGraph?.images as { url: string }[];
    expect(openGraphImages[0].url).toBe("https://maayan2000.co.il/uploads/branch-42.jpg");
  });

  it("laisse une image déjà absolue inchangée", () => {
    const metadata = buildBranchMetadata(
      makeInput({ mainImage: "https://cdn.example.com/branch-42.jpg" })
    );
    const openGraphImages = metadata.openGraph?.images as { url: string }[];
    expect(openGraphImages[0].url).toBe("https://cdn.example.com/branch-42.jpg");
  });

  it("mappe chaque locale applicative vers le code Open Graph xx_XX attendu", () => {
    expect(buildBranchMetadata(makeInput({ locale: "he" })).openGraph?.locale).toBe("he_IL");
    expect(buildBranchMetadata(makeInput({ locale: "en" })).openGraph?.locale).toBe("en_US");
    expect(buildBranchMetadata(makeInput({ locale: "ru" })).openGraph?.locale).toBe("ru_RU");
    expect(buildBranchMetadata(makeInput({ locale: "fr" })).openGraph?.locale).toBe("fr_FR");
    expect(buildBranchMetadata(makeInput({ locale: "es" })).openGraph?.locale).toBe("es_ES");
  });

  it("le Twitter Card réutilise le même titre/description/image, jamais un second contenu", () => {
    const metadata = buildBranchMetadata(makeInput({ seoTitle: "Titre", seoDescription: "Desc" }));
    expect(metadata.twitter?.title).toBe("Titre");
    expect(metadata.twitter?.description).toBe("Desc");
    expect((metadata.twitter?.images as string[])[0]).toBe(
      (metadata.openGraph?.images as { url: string }[])[0].url
    );
  });
});

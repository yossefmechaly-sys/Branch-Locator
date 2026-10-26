import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBreadcrumbSchema, buildGroceryStoreSchema, type GroceryStoreSchemaInput } from "@/lib/seo/schema";
import type { OpeningHoursEntry } from "@/types/opening-hours";

const OPENING_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 0, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
];

function makeInput(overrides: Partial<GroceryStoreSchemaInput> = {}): GroceryStoreSchemaInput {
  return {
    name: "Maayan 2000 – Ramot",
    url: "https://maayan2000.co.il/he/branches/jerusalem-ramot",
    image: null,
    telephone: null,
    streetAddress: null,
    addressLocality: null,
    postalCode: null,
    latitude: 31.8,
    longitude: 35.2,
    openingHours: OPENING_HOURS,
    mapUrl: null,
    ...overrides,
  };
}

describe("buildGroceryStoreSchema (§21-§24 Phase 8 : ne jamais inventer de donnée)", () => {
  it("produit un GroceryStore minimal valide même sans aucune donnée optionnelle", () => {
    const schema = buildGroceryStoreSchema(makeInput());

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("GroceryStore");
    expect(schema.name).toBe("Maayan 2000 – Ramot");
    expect(schema.url).toBe("https://maayan2000.co.il/he/branches/jerusalem-ramot");
    expect(schema.geo).toEqual({ "@type": "GeoCoordinates", latitude: 31.8, longitude: 35.2 });
  });

  it("omet image/telephone/hasMap quand la donnée source est absente — jamais de valeur vide", () => {
    const schema = buildGroceryStoreSchema(makeInput());
    expect(schema).not.toHaveProperty("image");
    expect(schema).not.toHaveProperty("telephone");
    expect(schema).not.toHaveProperty("hasMap");
  });

  it("inclut image/telephone/hasMap quand la donnée est présente", () => {
    const schema = buildGroceryStoreSchema(
      makeInput({
        image: "https://maayan2000.co.il/uploads/branch.jpg",
        telephone: "+972-2-1234567",
        mapUrl: "https://www.google.com/maps/dir/?api=1&destination=31.8%2C35.2",
      })
    );
    expect(schema.image).toBe("https://maayan2000.co.il/uploads/branch.jpg");
    expect(schema.telephone).toBe("+972-2-1234567");
    expect(schema.hasMap).toBe("https://www.google.com/maps/dir/?api=1&destination=31.8%2C35.2");
  });

  describe("image relative → URL absolue (§21 : Schema.org exige une URL absolue)", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://maayan2000.co.il");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("rend absolue une image stockée en base comme un chemin relatif", () => {
      const schema = buildGroceryStoreSchema(makeInput({ image: "/demo/branches/jerusalem-ramot.jpg" }));
      expect(schema.image).toBe("https://maayan2000.co.il/demo/branches/jerusalem-ramot.jpg");
    });

    it("laisse une image déjà absolue inchangée", () => {
      const schema = buildGroceryStoreSchema(makeInput({ image: "https://cdn.example.com/branch.jpg" }));
      expect(schema.image).toBe("https://cdn.example.com/branch.jpg");
    });
  });

  it("l'adresse inclut toujours addressCountry: IL, même sans autre champ d'adresse", () => {
    const schema = buildGroceryStoreSchema(makeInput());
    expect(schema.address).toEqual({ "@type": "PostalAddress", addressCountry: "IL" });
  });

  it("omet streetAddress/addressLocality/postalCode individuellement quand absents", () => {
    const schema = buildGroceryStoreSchema(makeInput({ streetAddress: "Ramot Blvd 1" }));
    const address = schema.address as Record<string, unknown>;
    expect(address.streetAddress).toBe("Ramot Blvd 1");
    expect(address).not.toHaveProperty("addressLocality");
    expect(address).not.toHaveProperty("postalCode");
  });

  it("inclut openingHoursSpecification construit à partir des horaires hebdomadaires", () => {
    const schema = buildGroceryStoreSchema(makeInput());
    expect(Array.isArray(schema.openingHoursSpecification)).toBe(true);
    expect((schema.openingHoursSpecification as unknown[]).length).toBeGreaterThan(0);
  });

  describe("makesOffer / Schema.org Offer (Phase 9, §17)", () => {
    it("omet makesOffer quand aucune offre n'est fournie — jamais un tableau vide inséré", () => {
      const schema = buildGroceryStoreSchema(makeInput());
      expect(schema).not.toHaveProperty("makesOffer");
    });

    it("omet makesOffer quand `offers` est un tableau vide", () => {
      const schema = buildGroceryStoreSchema(makeInput({ offers: [] }));
      expect(schema).not.toHaveProperty("makesOffer");
    });

    it("construit un Offer avec price/priceCurrency/validFrom/validThrough — jamais `availability` (donnée de stock non fiable)", () => {
      const schema = buildGroceryStoreSchema(
        makeInput({
          offers: [
            {
              price: "29.90",
              currency: "ILS",
              name: "Fresh chicken",
              url: "https://example.com/promo",
              validFrom: "2026-08-25",
              validThrough: "2026-09-03",
            },
          ],
        })
      );

      const offers = schema.makesOffer as Record<string, unknown>[];
      expect(offers).toHaveLength(1);
      expect(offers[0]).toMatchObject({
        "@type": "Offer",
        price: "29.90",
        priceCurrency: "ILS",
        validFrom: "2026-08-25",
        validThrough: "2026-09-03",
        url: "https://example.com/promo",
      });
      expect(offers[0]).not.toHaveProperty("availability");
      expect(offers[0].itemOffered).toEqual({ "@type": "Product", name: "Fresh chicken" });
    });

    it("omet itemOffered/url quand name/url sont absents — jamais une valeur inventée", () => {
      const schema = buildGroceryStoreSchema(
        makeInput({
          offers: [
            {
              price: "9.90",
              currency: "ILS",
              name: null,
              url: null,
              validFrom: "2026-08-24",
              validThrough: "2026-09-10",
            },
          ],
        })
      );

      const offers = schema.makesOffer as Record<string, unknown>[];
      expect(offers[0]).not.toHaveProperty("itemOffered");
      expect(offers[0]).not.toHaveProperty("url");
    });

    it("gère plusieurs offres pour un même magasin", () => {
      const schema = buildGroceryStoreSchema(
        makeInput({
          offers: [
            { price: "29.90", currency: "ILS", name: "A", url: null, validFrom: "2026-08-25", validThrough: "2026-09-03" },
            { price: "9.90", currency: "ILS", name: "B", url: null, validFrom: "2026-08-26", validThrough: "2026-09-08" },
          ],
        })
      );

      expect((schema.makesOffer as unknown[]).length).toBe(2);
    });
  });
});

describe("buildBreadcrumbSchema (§31 Phase 8)", () => {
  it("numérote les positions à partir de 1, dans l'ordre fourni", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Accueil", url: "https://maayan2000.co.il/he" },
      { name: "Magasins", url: "https://maayan2000.co.il/he/branches" },
      { name: "Ramot", url: null },
    ]);

    const items = schema.itemListElement as Record<string, unknown>[];
    expect(items.map((item) => item.position)).toEqual([1, 2, 3]);
  });

  it("omet `item` pour l'étape sans URL (page courante), jamais un lien vers elle-même", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Accueil", url: "https://maayan2000.co.il/he" },
      { name: "Ramot", url: null },
    ]);

    const items = schema.itemListElement as Record<string, unknown>[];
    expect(items[0].item).toBe("https://maayan2000.co.il/he");
    expect(items[1]).not.toHaveProperty("item");
    expect(items[1].name).toBe("Ramot");
  });
});

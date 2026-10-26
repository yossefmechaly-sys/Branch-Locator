import { describe, expect, it } from "vitest";

import { promotionInputSchema } from "@/lib/validators/promotion";

/**
 * `promotionInputSchema` (Phase 9, §11/§12/§14/§25) — validation SERVEUR, la
 * seule qui fasse foi. Couvre la liste explicite du cahier des charges §25 :
 * globale/locale, aucun magasin alors que locale, decimal sans perte,
 * originalPrice optionnel, traduction hébreu, date invalide/future/expirée.
 */
function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    slug: "fresh-chicken-ramot",
    image: null,
    price: "29.90",
    originalPrice: "39.90",
    currency: "ILS",
    unit: "KG",
    startDate: "2026-08-25",
    endDate: "2026-09-03",
    url: null,
    status: "ACTIVE",
    appliesToAll: false,
    branchIds: ["branch-1"],
    isFeatured: true,
    priority: 10,
    translations: [{ locale: "he", productName: "עוף טרי", title: "מבצע היום", description: null, ctaLabel: null }],
    ...overrides,
  };
}

describe("promotionInputSchema (Phase 9, §11)", () => {
  it("accepte une promotion locale complète avec l'exemple exact du cahier des charges (29.90/kg)", () => {
    const result = promotionInputSchema.safeParse(basePayload());
    expect(result.success).toBe(true);
  });

  it("rejette une traduction hébreu absente (§4/§11, obligatoire)", () => {
    const result = promotionInputSchema.safeParse(
      basePayload({ translations: [{ locale: "en", title: "Today's deal", productName: null, description: null, ctaLabel: null }] })
    );
    expect(result.success).toBe(false);
  });

  it("rejette endDate strictement antérieure à startDate", () => {
    const result = promotionInputSchema.safeParse(basePayload({ startDate: "2026-09-03", endDate: "2026-08-25" }));
    expect(result.success).toBe(false);
  });

  it("accepte startDate === endDate (une promotion d'un seul jour)", () => {
    const result = promotionInputSchema.safeParse(basePayload({ startDate: "2026-09-01", endDate: "2026-09-01" }));
    expect(result.success).toBe(true);
  });

  it("§12 : rejette une promotion locale (appliesToAll=false) sans aucun magasin sélectionné", () => {
    const result = promotionInputSchema.safeParse(basePayload({ appliesToAll: false, branchIds: [] }));
    expect(result.success).toBe(false);
  });

  it("§12 : rejette une promotion globale (appliesToAll=true) qui conserve des magasins sélectionnés", () => {
    const result = promotionInputSchema.safeParse(basePayload({ appliesToAll: true, branchIds: ["branch-1"] }));
    expect(result.success).toBe(false);
  });

  it("§12 : accepte une promotion globale sans aucun magasin sélectionné", () => {
    const result = promotionInputSchema.safeParse(basePayload({ appliesToAll: true, branchIds: [] }));
    expect(result.success).toBe(true);
  });

  it("§11 : rejette un prix avec plus de deux décimales (jamais de perte lors de la conversion en centimes)", () => {
    const result = promotionInputSchema.safeParse(basePayload({ price: "29.999" }));
    expect(result.success).toBe(false);
  });

  it("§11 : rejette un prix avec une virgule ou un symbole (jamais de parseFloat permissif)", () => {
    expect(promotionInputSchema.safeParse(basePayload({ price: "29,90" })).success).toBe(false);
    expect(promotionInputSchema.safeParse(basePayload({ price: "29.90 ₪" })).success).toBe(false);
  });

  it("§5 : originalPrice est optionnel — une promotion sans réduction reste valide", () => {
    const result = promotionInputSchema.safeParse(basePayload({ originalPrice: null }));
    expect(result.success).toBe(true);
  });

  it("rejette un originalPrice renseigné alors que price est absent (promotion éditoriale)", () => {
    const result = promotionInputSchema.safeParse(basePayload({ price: null, originalPrice: "39.90" }));
    expect(result.success).toBe(false);
  });

  it("accepte une promotion éditoriale sans prix ni produit (bannière historique Phase 3/8)", () => {
    const result = promotionInputSchema.safeParse(
      basePayload({
        price: null,
        originalPrice: null,
        appliesToAll: true,
        branchIds: [],
        translations: [{ locale: "he", productName: null, title: "מבצעי פתיחה", description: null, ctaLabel: null }],
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepte un statut SCHEDULED (promotion future) et EXPIRED (promotion passée) — l'admin peut créer les deux (§14)", () => {
    expect(promotionInputSchema.safeParse(basePayload({ status: "SCHEDULED", startDate: "2027-01-01", endDate: "2027-01-10" })).success).toBe(true);
    expect(promotionInputSchema.safeParse(basePayload({ status: "EXPIRED", startDate: "2020-01-01", endDate: "2020-01-10" })).success).toBe(true);
  });

  it("rejette une date invalide", () => {
    const result = promotionInputSchema.safeParse(basePayload({ startDate: "pas-une-date" }));
    expect(result.success).toBe(false);
  });

  it("§1 : rejette un slug contenant des majuscules ou des espaces", () => {
    expect(promotionInputSchema.safeParse(basePayload({ slug: "Fresh Chicken" })).success).toBe(false);
  });

  it("isFeatured et priority sont pris tels quels, jamais déduits (§13)", () => {
    const result = promotionInputSchema.safeParse(basePayload({ isFeatured: false, priority: 0 }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFeatured).toBe(false);
      expect(result.data.priority).toBe(0);
    }
  });
});

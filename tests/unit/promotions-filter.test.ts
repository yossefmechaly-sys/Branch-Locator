import { describe, expect, it } from "vitest";

import { filterActivePromotions, isPromotionActive, type PromotionActivityInput } from "@/lib/promotions/filter";

/**
 * `referenceDate` volontairement choisi à 22:30 UTC (Phase 8, §11/§24) — soit
 * après minuit à Jérusalem (UTC+3 en été) : si `isPromotionActive()` lisait la
 * date calendaire en UTC plutôt qu'en heure d'Israël (`getIsraelNow()`), le
 * jour retenu serait le 14, pas le 15 — ce test échouerait silencieusement
 * avec la mauvaise implémentation, exactement le genre d'erreur que §11 veut
 * éviter (« ne jamais recalculer la date autrement que via le moteur horaire
 * partagé »).
 */
const REFERENCE_DATE = new Date("2026-06-14T22:30:00.000Z"); // 2026-06-15 01:30 Asia/Jerusalem

function makePromotion(overrides: Partial<PromotionActivityInput> = {}): PromotionActivityInput {
  return {
    status: "ACTIVE",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    ...overrides,
  };
}

describe("isPromotionActive (§11 Phase 8)", () => {
  it("est active quand le statut est ACTIVE et la date du jour (Israël) est dans [startDate, endDate]", () => {
    expect(isPromotionActive(makePromotion(), REFERENCE_DATE)).toBe(true);
  });

  it("n'est jamais active si le statut n'est pas ACTIVE, même si les dates correspondent", () => {
    for (const status of ["DRAFT", "SCHEDULED", "EXPIRED", "ARCHIVED"] as const) {
      expect(isPromotionActive(makePromotion({ status }), REFERENCE_DATE)).toBe(false);
    }
  });

  it("n'est pas active avant sa date de début", () => {
    const promotion = makePromotion({ startDate: "2026-06-16", endDate: "2026-06-30" });
    expect(isPromotionActive(promotion, REFERENCE_DATE)).toBe(false);
  });

  it("n'est plus active après sa date de fin", () => {
    const promotion = makePromotion({ startDate: "2026-06-01", endDate: "2026-06-14" });
    expect(isPromotionActive(promotion, REFERENCE_DATE)).toBe(false);
  });

  it("est active exactement le jour de startDate (borne inclusive)", () => {
    const promotion = makePromotion({ startDate: "2026-06-15", endDate: "2026-06-30" });
    expect(isPromotionActive(promotion, REFERENCE_DATE)).toBe(true);
  });

  it("est active exactement le jour de endDate (borne inclusive)", () => {
    const promotion = makePromotion({ startDate: "2026-06-01", endDate: "2026-06-15" });
    expect(isPromotionActive(promotion, REFERENCE_DATE)).toBe(true);
  });

  it("calcule la date du jour dans le fuseau Asia/Jerusalem, jamais en UTC", () => {
    // 22:30 UTC le 14 juin = 01:30 le 15 juin à Jérusalem : une promotion qui ne
    // commence QUE le 15 doit déjà être active à cet instant précis.
    const promotion = makePromotion({ startDate: "2026-06-15", endDate: "2026-06-15" });
    expect(isPromotionActive(promotion, REFERENCE_DATE)).toBe(true);
  });
});

describe("filterActivePromotions (§11 Phase 8)", () => {
  it("ne conserve que les promotions actives, sans réordonner les autres", () => {
    const promotions = [
      { id: "expired", ...makePromotion({ endDate: "2026-06-10" }) },
      { id: "active-1", ...makePromotion() },
      { id: "draft", ...makePromotion({ status: "DRAFT" as const }) },
      { id: "active-2", ...makePromotion({ startDate: "2026-06-15", endDate: "2026-06-15" }) },
      { id: "future", ...makePromotion({ startDate: "2026-07-01", endDate: "2026-07-31" }) },
    ];

    const result = filterActivePromotions(promotions, REFERENCE_DATE);

    expect(result.map((p) => p.id)).toEqual(["active-1", "active-2"]);
  });

  it("retourne une liste vide si aucune promotion n'est active, sans jamais planter", () => {
    const promotions = [{ id: "expired", ...makePromotion({ endDate: "2026-01-01" }) }];
    expect(filterActivePromotions(promotions, REFERENCE_DATE)).toEqual([]);
  });

  it("retourne une liste vide en entrée sans erreur", () => {
    expect(filterActivePromotions([], REFERENCE_DATE)).toEqual([]);
  });
});

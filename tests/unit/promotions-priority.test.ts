import { describe, expect, it } from "vitest";

import { selectFeaturedPromotion, sortPromotionsByPriority, type PromotionPriorityInput } from "@/lib/promotions/priority";

function make(overrides: Partial<PromotionPriorityInput> & { id: string }): PromotionPriorityInput {
  return {
    priority: 0,
    isLocalToBranch: false,
    isFeatured: false,
    ...overrides,
  };
}

describe("sortPromotionsByPriority (Phase 9, §8)", () => {
  it("place TOUTES les promotions locales avant TOUTES les globales, quelle que soit leur priority", () => {
    const promotions = [
      make({ id: "global-high", isLocalToBranch: false, priority: 100 }),
      make({ id: "local-low", isLocalToBranch: true, priority: 1 }),
    ];

    const sorted = sortPromotionsByPriority(promotions);
    expect(sorted.map((p) => p.id)).toEqual(["local-low", "global-high"]);
  });

  it("départage par priority décroissant à l'intérieur d'un même groupe local/global", () => {
    const promotions = [
      make({ id: "local-1", isLocalToBranch: true, priority: 1 }),
      make({ id: "local-10", isLocalToBranch: true, priority: 10 }),
      make({ id: "local-5", isLocalToBranch: true, priority: 5 }),
    ];

    const sorted = sortPromotionsByPriority(promotions);
    expect(sorted.map((p) => p.id)).toEqual(["local-10", "local-5", "local-1"]);
  });

  it("départage final par id (ordre croissant), pour un tri stable et déterministe", () => {
    const promotions = [
      make({ id: "b", priority: 5 }),
      make({ id: "a", priority: 5 }),
    ];

    const sorted = sortPromotionsByPriority(promotions);
    expect(sorted.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("ne mute jamais le tableau reçu", () => {
    const promotions = [make({ id: "a", priority: 1 }), make({ id: "b", priority: 2 })];
    const original = [...promotions];
    sortPromotionsByPriority(promotions);
    expect(promotions).toEqual(original);
  });
});

describe("selectFeaturedPromotion (Phase 9, §10)", () => {
  it("retourne null quand aucune promotion n'est isFeatured — jamais déduit d'une simple activité", () => {
    const promotions = [make({ id: "a", isFeatured: false }), make({ id: "b", isFeatured: false })];
    expect(selectFeaturedPromotion(promotions)).toBeNull();
  });

  it("retourne null pour une liste vide", () => {
    expect(selectFeaturedPromotion([])).toBeNull();
  });

  it("retourne l'unique promotion featured", () => {
    const promotions = [make({ id: "a", isFeatured: false }), make({ id: "b", isFeatured: true })];
    expect(selectFeaturedPromotion(promotions)?.id).toBe("b");
  });

  it("parmi plusieurs promotions featured, applique la même règle locale > globale > priority", () => {
    const promotions = [
      make({ id: "global-featured", isFeatured: true, isLocalToBranch: false, priority: 100 }),
      make({ id: "local-featured", isFeatured: true, isLocalToBranch: true, priority: 1 }),
      make({ id: "not-featured", isFeatured: false, isLocalToBranch: true, priority: 1000 }),
    ];

    expect(selectFeaturedPromotion(promotions)?.id).toBe("local-featured");
  });
});

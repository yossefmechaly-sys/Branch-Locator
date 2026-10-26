import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { PromotionCard } from "@/components/branches/PromotionCard";
import { track } from "@/lib/analytics/track";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeLocalizedPromotion } from "./helpers/branch-fixture";

vi.mock("@/lib/analytics/track", () => ({ track: vi.fn() }));

describe("PromotionCard (Phase 9, §11/§18)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("émet promotion_view UNE FOIS au montage, avec promotionId et branchId — jamais de donnée personnelle", () => {
    renderWithIntl(
      <PromotionCard
        promotion={makeLocalizedPromotion({ id: "promo-1" })}
        branchId="branch-42"
        locale="en"
      />
    );

    expect(track).toHaveBeenCalledWith({
      name: "promotion_view",
      promotionId: "promo-1",
      branchId: "branch-42",
    });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("émet promotion_click au clic sur le CTA externe", () => {
    renderWithIntl(
      <PromotionCard
        promotion={makeLocalizedPromotion({
          id: "promo-1",
          ctaUrl: "https://example.com/promo",
          ctaLabel: "See details",
        })}
        branchId="branch-42"
        locale="en"
      />
    );

    fireEvent.click(screen.getByRole("link", { name: /See details/ }));

    expect(track).toHaveBeenCalledWith({
      name: "promotion_click",
      promotionId: "promo-1",
      branchId: "branch-42",
    });
  });

  it("rend le prix visuellement dominant (police la plus grande de la carte) — §11 impératif", () => {
    renderWithIntl(
      <PromotionCard
        promotion={makeLocalizedPromotion({
          id: "promo-1",
          productName: "Fresh chicken",
          price: "29.90",
          currency: "ILS",
          unit: "KG",
        })}
        branchId="branch-1"
        locale="en"
      />
    );

    const priceElement = screen.getByText(/29\.90/);
    expect(priceElement.className).toContain("text-2xl");
  });

  it("formate correctement le prix en hébreu (RTL) sans jamais coder ₪ en dur dans le composant", () => {
    const { container } = renderWithIntl(
      <PromotionCard
        promotion={makeLocalizedPromotion({
          id: "promo-1",
          productName: "עוף טרי",
          price: "29.90",
          currency: "ILS",
          unit: "KG",
          title: "מבצע היום",
        })}
        branchId="branch-1"
        locale="he"
      />,
      "he"
    );

    expect(container.querySelector('[dir="rtl"]')).toBeTruthy();
    expect(screen.getByText("עוף טרי")).toBeTruthy();
    expect(screen.getByText(/29\.90/)).toBeTruthy();
    expect(screen.getByText('לק"ג')).toBeTruthy();
  });

  it("affiche l'icône flamme uniquement quand isFeatured est vrai", () => {
    const { container: withFlame } = renderWithIntl(
      <PromotionCard
        promotion={makeLocalizedPromotion({ id: "promo-1", isFeatured: true })}
        branchId="branch-1"
        locale="en"
      />
    );
    expect(withFlame.querySelector("svg")).toBeTruthy();

    const { container: withoutFlame } = renderWithIntl(
      <PromotionCard
        promotion={makeLocalizedPromotion({ id: "promo-2", isFeatured: false, ctaUrl: null })}
        branchId="branch-1"
        locale="en"
      />
    );
    expect(withoutFlame.querySelector("svg")).toBeNull();
  });
});

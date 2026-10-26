import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { BranchCard } from "@/components/branches/BranchCard";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeBranchSummary, makeLocalizedPromotion } from "./helpers/branch-fixture";

describe("BranchCard — intégration promotion featured compacte (Phase 9, §13)", () => {
  it("ne rend AUCUN bloc promotion quand featuredPromotion est null — comportement/rendu EXACTEMENT comme avant la Phase 9", () => {
    const branch = makeBranchSummary({ id: "jerusalem-ramot", displayName: "Maayan 2000 – Ramot" });
    renderWithIntl(<BranchCard branch={branch} locale="en" isSelected={false} onSelect={vi.fn()} />);

    expect(screen.getByText("Maayan 2000 – Ramot")).toBeTruthy();
    expect(screen.queryByText(/₪/)).toBeNull();
  });

  it("affiche le bloc compact featured (produit + prix) quand featuredPromotion est renseigné", () => {
    const branch = makeBranchSummary({
      id: "jerusalem-ramot",
      displayName: "Maayan 2000 – Ramot",
      featuredPromotion: makeLocalizedPromotion({
        id: "chicken",
        productName: "Fresh chicken",
        price: "29.90",
        originalPrice: "39.90",
        currency: "ILS",
        unit: "KG",
        isFeatured: true,
        priority: 10,
      }),
    });

    renderWithIntl(<BranchCard branch={branch} locale="en" isSelected={false} onSelect={vi.fn()} />);

    expect(screen.getByText("Fresh chicken")).toBeTruthy();
    expect(screen.getByText(/29\.90/)).toBeTruthy();
    expect(screen.getByText(/39\.90/)).toBeTruthy();
    expect(screen.getByText("-25%")).toBeTruthy();
  });

  it("bascule sur le titre de la promotion quand productName est absent (promotion éditoriale)", () => {
    const branch = makeBranchSummary({
      id: "jerusalem-ramot",
      featuredPromotion: makeLocalizedPromotion({
        id: "banner",
        productName: null,
        price: null,
        title: "Grand Opening Deals",
        isFeatured: true,
      }),
    });

    renderWithIntl(<BranchCard branch={branch} locale="en" isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText("Grand Opening Deals")).toBeTruthy();
  });
});

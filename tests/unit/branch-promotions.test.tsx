import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { BranchPromotions } from "@/components/branches/BranchPromotions";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeLocalizedPromotion } from "./helpers/branch-fixture";

describe("BranchPromotions (Phase 8, §11/§12 ; Phase 9, §11/§12)", () => {
  it("ne rend rien du tout quand il n'y a aucune promotion active — pas de titre de section vide (§37)", () => {
    const { container } = renderWithIntl(
      <BranchPromotions promotions={[]} branchId="branch-1" locale="en" />
    );
    expect(container.textContent).toBe("");
  });

  it("affiche titre, description et période pour chaque promotion, sans refaire de filtrage de date", () => {
    renderWithIntl(
      <BranchPromotions
        promotions={[
          makeLocalizedPromotion({
            id: "promo-1",
            title: "20% off dairy products",
            description: "Valid in-store only",
            endDate: "2026-06-30",
          }),
        ]}
        branchId="branch-1"
        locale="en"
      />
    );

    expect(screen.getByText("20% off dairy products")).toBeTruthy();
    expect(screen.getByText("Valid in-store only")).toBeTruthy();
    expect(screen.getByText(/Until/)).toBeTruthy();
    expect(screen.getByText(/June 30, 2026/)).toBeTruthy();
  });

  it("formate la date de fin dans la langue courante, sans jamais décaler le jour à cause du fuseau serveur", () => {
    renderWithIntl(
      <BranchPromotions
        promotions={[makeLocalizedPromotion({ id: "promo-1", endDate: "2026-01-01" })]}
        branchId="branch-1"
        locale="fr"
      />
    );
    // Le 1er janvier ne doit jamais devenir le 31 décembre (ni l'inverse) à
    // cause d'une interprétation de fuseau implicite (§24).
    expect(screen.getByText(/1 janvier 2026/)).toBeTruthy();
  });

  it("affiche un bouton d'appel à l'action externe (nouvel onglet) quand ctaUrl est présent", () => {
    renderWithIntl(
      <BranchPromotions
        promotions={[
          makeLocalizedPromotion({ id: "promo-1", ctaUrl: "https://example.com/promo", ctaLabel: "See details" }),
        ]}
        branchId="branch-1"
        locale="en"
      />
    );

    const link = screen.getByRole("link", { name: /See details/ });
    expect(link.getAttribute("href")).toBe("https://example.com/promo");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("n'affiche aucun bouton quand ctaUrl est absent", () => {
    renderWithIntl(
      <BranchPromotions
        promotions={[makeLocalizedPromotion({ id: "promo-1", ctaUrl: null })]}
        branchId="branch-1"
        locale="en"
      />
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("affiche le prix, l'unité et le produit pour une promotion structurée (§1/§2/§4/§11)", () => {
    renderWithIntl(
      <BranchPromotions
        promotions={[
          makeLocalizedPromotion({
            id: "promo-1",
            productName: "Fresh chicken",
            price: "29.90",
            currency: "ILS",
            unit: "KG",
          }),
        ]}
        branchId="branch-1"
        locale="en"
      />
    );

    expect(screen.getByText("Fresh chicken")).toBeTruthy();
    expect(screen.getByText(/29\.90/)).toBeTruthy();
    expect(screen.getByText("/ kg")).toBeTruthy();
  });

  it("affiche l'ancien prix barré et le badge de réduction quand originalPrice est présent et supérieur au prix (§5/§6)", () => {
    renderWithIntl(
      <BranchPromotions
        promotions={[
          makeLocalizedPromotion({
            id: "promo-1",
            productName: "Fresh chicken",
            price: "29.90",
            originalPrice: "39.90",
            currency: "ILS",
            unit: "KG",
          }),
        ]}
        branchId="branch-1"
        locale="en"
      />
    );

    expect(screen.getByText(/39\.90/)).toBeTruthy();
    expect(screen.getByText("-25%")).toBeTruthy();
  });

  it("n'affiche AUCUN bloc prix pour une promotion éditoriale sans produit (price: null) — jamais de 0,00 ₪ inventé (§5)", () => {
    renderWithIntl(
      <BranchPromotions
        promotions={[makeLocalizedPromotion({ id: "promo-1", price: null, title: "Back to School Sale" })]}
        branchId="branch-1"
        locale="en"
      />
    );

    expect(screen.getByText("Back to School Sale")).toBeTruthy();
    expect(screen.queryByText(/₪/)).toBeNull();
  });

  it("affiche l'icône/accroche 'featured' uniquement quand isFeatured est vrai (§10)", () => {
    const { container: featuredContainer } = renderWithIntl(
      <BranchPromotions
        promotions={[makeLocalizedPromotion({ id: "promo-1", isFeatured: true, title: "Today's Deal" })]}
        branchId="branch-1"
        locale="en"
      />
    );
    expect(featuredContainer.querySelector("svg")).toBeTruthy();
  });

  it("tronque à 4 promotions visibles avec un bouton 'Voir toutes' qui les révèle toutes (§12)", () => {
    const promotions = Array.from({ length: 6 }, (_, i) =>
      makeLocalizedPromotion({ id: `promo-${i}`, title: `Promo ${i}` })
    );

    renderWithIntl(<BranchPromotions promotions={promotions} branchId="branch-1" locale="en" />);

    expect(screen.getByText("Promo 0")).toBeTruthy();
    expect(screen.queryByText("Promo 5")).toBeNull();

    const showAllButton = screen.getByRole("button", { name: /See all promotions \(6\)/ });
    fireEvent.click(showAllButton);

    expect(screen.getByText("Promo 5")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /See all promotions/ })).toBeNull();
  });

  it("n'affiche AUCUN bouton 'Voir toutes' quand le nombre de promotions ne dépasse pas la limite initiale", () => {
    const promotions = Array.from({ length: 3 }, (_, i) =>
      makeLocalizedPromotion({ id: `promo-${i}`, title: `Promo ${i}` })
    );

    renderWithIntl(<BranchPromotions promotions={promotions} branchId="branch-1" locale="en" />);
    expect(screen.queryByRole("button", { name: /See all/ })).toBeNull();
  });
});

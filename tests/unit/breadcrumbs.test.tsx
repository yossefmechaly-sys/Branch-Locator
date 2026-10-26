import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { Breadcrumbs } from "@/components/branches/Breadcrumbs";

import { renderWithIntl } from "./helpers/render-with-intl";

describe("Breadcrumbs (Phase 8, §31)", () => {
  it("affiche le fil visible Accueil → Magasins → Ville → Magasin", () => {
    const { container } = renderWithIntl(
      <Breadcrumbs
        locale="en"
        cityName="Jerusalem"
        citySlug="jerusalem"
        branchDisplayName="Maayan 2000 – Ramot"
        homeUrl="https://maayan2000.co.il/en"
        branchesUrl="https://maayan2000.co.il/en/branches"
      />
    );

    const items = Array.from(container.querySelectorAll('ol li:not([aria-hidden="true"])')).map(
      (li) => li.textContent
    );
    expect(items).toEqual(["Home", "Branches", "Jerusalem", "Maayan 2000 – Ramot"]);
  });

  it("rend la ville cliquable vers le Store Locator filtré par ville", () => {
    renderWithIntl(
      <Breadcrumbs
        locale="en"
        cityName="Jerusalem"
        citySlug="jerusalem"
        branchDisplayName="Maayan 2000 – Ramot"
        homeUrl="https://maayan2000.co.il/en"
        branchesUrl="https://maayan2000.co.il/en/branches"
      />
    );

    const cityLink = screen.getByRole("link", { name: "Jerusalem" });
    expect(cityLink.getAttribute("href")).toContain("/en/branches?city=jerusalem");
  });

  it("marque la dernière étape comme la page courante (aria-current)", () => {
    renderWithIntl(
      <Breadcrumbs
        locale="en"
        cityName="Jerusalem"
        citySlug="jerusalem"
        branchDisplayName="Maayan 2000 – Ramot"
        homeUrl="https://maayan2000.co.il/en"
        branchesUrl="https://maayan2000.co.il/en/branches"
      />
    );
    expect(screen.getByText("Maayan 2000 – Ramot").getAttribute("aria-current")).toBe("page");
  });

  it("embarque un BreadcrumbList JSON-LD utilisant les URLs absolues fournies, jamais un lien vers l'étape courante", () => {
    const { container } = renderWithIntl(
      <Breadcrumbs
        locale="en"
        cityName="Jerusalem"
        citySlug="jerusalem"
        branchDisplayName="Maayan 2000 – Ramot"
        homeUrl="https://maayan2000.co.il/en"
        branchesUrl="https://maayan2000.co.il/en/branches"
      />
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script!.innerHTML);

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(4);
    expect(schema.itemListElement[0]).toMatchObject({ position: 1, name: "Home", item: "https://maayan2000.co.il/en" });
    expect(schema.itemListElement[2]).toMatchObject({
      position: 3,
      name: "Jerusalem",
      item: "https://maayan2000.co.il/en/branches?city=jerusalem",
    });
    expect(schema.itemListElement[3]).not.toHaveProperty("item");
    expect(schema.itemListElement[3].name).toBe("Maayan 2000 – Ramot");
  });
});

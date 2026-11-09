import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { NearbyBranches } from "@/components/branches/NearbyBranches";
import type { BranchSummary } from "@/types/branch";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeBranchSummary } from "./helpers/branch-fixture";

const BRANCHES: BranchSummary[] = [
  makeBranchSummary({ id: "jerusalem-center", slug: "jerusalem-center", displayName: "Zol Uvegadol – Center" }),
  makeBranchSummary({ id: "jerusalem-talpiot", slug: "jerusalem-talpiot", displayName: "Zol Uvegadol – Talpiot" }),
];

describe("NearbyBranches (Phase 8, §30)", () => {
  it("ne rend rien quand la ville n'a aucun autre magasin — pas de section vide (§37)", () => {
    const { container } = renderWithIntl(
      <NearbyBranches branches={[]} cityName="Jerusalem" locale="en" />
    );
    expect(container.textContent).toBe("");
  });

  it("affiche un lien par magasin, avec le nom de la ville dans le titre de section", () => {
    renderWithIntl(<NearbyBranches branches={BRANCHES} cityName="Jerusalem" locale="en" />);

    expect(screen.getByText("Other Zol Uvegadol branches in Jerusalem")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Zol Uvegadol – Center/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Zol Uvegadol – Talpiot/ })).toBeTruthy();
  });

  it("chaque lien pointe vers la fiche du magasin correspondant, dans la locale courante", () => {
    renderWithIntl(<NearbyBranches branches={BRANCHES} cityName="Jerusalem" locale="fr" />);
    const link = screen.getByRole("link", { name: /Center/ });
    expect(link.getAttribute("href")).toBe("/fr/branches/jerusalem-center");
  });
});

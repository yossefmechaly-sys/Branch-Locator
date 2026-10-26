import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { BranchServices } from "@/components/branches/BranchServices";
import type { LocalizedService } from "@/types/branch";

import { renderWithIntl } from "./helpers/render-with-intl";

const SERVICES: LocalizedService[] = [
  { id: "parking", slug: "parking", icon: "parking-circle", name: "Parking", description: "Free parking on site" },
  { id: "delivery", slug: "delivery", icon: "truck", name: "Home delivery", description: null },
];

describe("BranchServices (Phase 8, §10)", () => {
  it("affiche un message explicite quand le magasin n'a aucun service, jamais une section vide silencieuse", () => {
    renderWithIntl(<BranchServices services={[]} />);
    expect(screen.getByText("No services listed for this branch yet")).toBeTruthy();
  });

  it("affiche la liste complète des services avec leur description quand elle existe", () => {
    renderWithIntl(<BranchServices services={SERVICES} />);
    expect(screen.getByText("Parking")).toBeTruthy();
    expect(screen.getByText("Free parking on site")).toBeTruthy();
    expect(screen.getByText("Home delivery")).toBeTruthy();
  });

  it("n'affiche pas de description quand elle est absente, sans planter", () => {
    renderWithIntl(<BranchServices services={[SERVICES[1]]} />);
    expect(screen.getByText("Home delivery")).toBeTruthy();
    expect(screen.queryByText("null")).toBeNull();
  });
});

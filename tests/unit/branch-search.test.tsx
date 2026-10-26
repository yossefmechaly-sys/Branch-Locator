import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { BranchSearch } from "@/components/branches/BranchSearch";

import { renderWithIntl } from "./helpers/render-with-intl";

describe("BranchSearch — bouton « près de moi » (§1/§14)", () => {
  it("est actif (non désactivé) et appelle onRequestLocation au clic, à l'état idle", () => {
    const onRequestLocation = vi.fn();
    renderWithIntl(
      <BranchSearch
        value=""
        onChange={vi.fn()}
        onRequestLocation={onRequestLocation}
        geolocationStatus="idle"
      />
    );

    const button = screen.getByRole("button", { name: "Find a branch near me" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(onRequestLocation).toHaveBeenCalledOnce();
  });

  it("se désactive pendant l'état requesting, pour éviter une double demande", () => {
    renderWithIntl(
      <BranchSearch
        value=""
        onChange={vi.fn()}
        onRequestLocation={vi.fn()}
        geolocationStatus="requesting"
      />
    );

    const button = screen.getByRole("button", { name: "Find a branch near me" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("redevient actif après un échec (denied) — permet à l'utilisateur de réessayer", () => {
    renderWithIntl(
      <BranchSearch
        value=""
        onChange={vi.fn()}
        onRequestLocation={vi.fn()}
        geolocationStatus="denied"
      />
    );

    const button = screen.getByRole("button", { name: "Find a branch near me" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it("traduit intégralement en hébreu (RTL), aucun texte codé en dur (§14)", () => {
    renderWithIntl(
      <BranchSearch
        value=""
        onChange={vi.fn()}
        onRequestLocation={vi.fn()}
        geolocationStatus="idle"
      />,
      "he"
    );
    expect(screen.getByRole("button", { name: "מצא סניף קרוב אליי" })).toBeTruthy();
  });
});

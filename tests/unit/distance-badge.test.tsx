import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { DistanceBadge } from "@/components/branches/DistanceBadge";

import { renderWithIntl } from "./helpers/render-with-intl";

describe("DistanceBadge (§3/§14)", () => {
  it("n'affiche rien tant que la distance est inconnue", () => {
    const { container } = renderWithIntl(<DistanceBadge distanceMeters={null} locale="en" />);
    expect(container.querySelector("span")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("affiche une distance en mètres sous 1 km", () => {
    renderWithIntl(<DistanceBadge distanceMeters={850} locale="en" />);
    expect(screen.getByText(/850/)).toBeTruthy();
  });

  it("affiche une distance en kilomètres au-delà de 1 km", () => {
    renderWithIntl(<DistanceBadge distanceMeters={2400} locale="en" />);
    expect(screen.getByText(/2\.4/)).toBeTruthy();
  });

  it("formate selon la locale hébraïque", () => {
    renderWithIntl(<DistanceBadge distanceMeters={850} locale="he" />, "he");
    expect(screen.getByText(/850/)).toBeTruthy();
  });
});

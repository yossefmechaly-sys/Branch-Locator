import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { MapErrorState } from "@/components/maps/MapErrorState";

import { renderWithIntl } from "./helpers/render-with-intl";

describe("MapErrorState", () => {
  it("clé API absente : affiche un état de développement clair, sans bouton réessayer (§19 — retenter sans redéployer ne changerait rien)", () => {
    renderWithIntl(<MapErrorState reason="missing_api_key" />);

    expect(screen.getByText("Map not configured")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("échec réseau/script : propose de réessayer et appelle onRetry (§18)", () => {
    const onRetry = vi.fn();
    renderWithIntl(<MapErrorState reason="load_failed" onRetry={onRetry} />);

    expect(screen.getByText("Map unavailable")).toBeTruthy();
    const retryButton = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("rappelle systématiquement que la liste reste utilisable, quelle que soit la cause (§18)", () => {
    renderWithIntl(<MapErrorState reason="load_failed" />);
    expect(
      screen.getByText("The branch list below still works — search and filters remain fully usable.")
    ).toBeTruthy();
  });

  it("traduit le message en hébreu (RTL) sans casser le rendu", () => {
    renderWithIntl(<MapErrorState reason="missing_api_key" />, "he");
    expect(screen.getByText("המפה לא הוגדרה")).toBeTruthy();
  });

  it("traduit le message en français (LTR)", () => {
    renderWithIntl(<MapErrorState reason="load_failed" />, "fr");
    expect(screen.getByText("Carte indisponible")).toBeTruthy();
  });
});

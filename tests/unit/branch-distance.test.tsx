import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { BranchDistance } from "@/components/branches/BranchDistance";

import { renderWithIntl } from "./helpers/render-with-intl";

function mockGeolocation(impl: {
  getCurrentPosition: (
    onSuccess: PositionCallback,
    onError?: PositionErrorCallback,
    options?: PositionOptions
  ) => void;
}) {
  Object.defineProperty(globalThis.navigator, "geolocation", { value: impl, configurable: true });
}

afterEach(() => {
  // @ts-expect-error -- nettoyage entre tests.
  delete globalThis.navigator.geolocation;
  vi.restoreAllMocks();
});

describe("BranchDistance (Phase 8, §15 — géolocalisation à la demande uniquement)", () => {
  it("affiche un bouton « près de moi » au départ, SANS jamais appeler getCurrentPosition automatiquement", () => {
    const getCurrentPosition = vi.fn();
    mockGeolocation({ getCurrentPosition });

    renderWithIntl(<BranchDistance latitude={31.8} longitude={35.2} locale="en" />);

    expect(screen.getByRole("button")).toBeTruthy();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("affiche la distance formatée seulement après un clic explicite et un octroi de permission", () => {
    const getCurrentPosition = vi.fn(
      (onSuccess: PositionCallback) => {
        // ~11 km au nord de la position simulée du magasin.
        onSuccess({ coords: { latitude: 31.9, longitude: 35.2 } } as GeolocationPosition);
      }
    );
    mockGeolocation({ getCurrentPosition });

    renderWithIntl(<BranchDistance latitude={31.8} longitude={35.2} locale="en" />);
    fireEvent.click(screen.getByRole("button"));

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button")).toBeNull();
    // Reste une approximation à vol d'oiseau, jamais un temps de trajet (§3).
    expect(screen.getByText(/km/)).toBeTruthy();
  });

  it("reste sur le bouton, sans planter, quand la permission est refusée", () => {
    const getCurrentPosition = vi.fn((_onSuccess: PositionCallback, onError?: PositionErrorCallback) => {
      onError?.({ code: 1 } as GeolocationPositionError);
    });
    mockGeolocation({ getCurrentPosition });

    renderWithIntl(<BranchDistance latitude={31.8} longitude={35.2} locale="en" />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toBeTruthy();
  });
});

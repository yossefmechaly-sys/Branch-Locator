import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useGeolocation } from "@/hooks/useGeolocation";

function mockGeolocation(impl: {
  getCurrentPosition: (
    onSuccess: PositionCallback,
    onError?: PositionErrorCallback,
    options?: PositionOptions
  ) => void;
}) {
  Object.defineProperty(globalThis.navigator, "geolocation", {
    value: impl,
    configurable: true,
  });
}

afterEach(() => {
  // @ts-expect-error -- nettoyage entre tests, réinitialise l'API globale.
  delete globalThis.navigator.geolocation;
  vi.restoreAllMocks();
});

describe("useGeolocation (§1/§8/§19/§20)", () => {
  it("démarre en idle et ne fait AUCUN appel à getCurrentPosition tant que requestLocation n'est pas invoqué", () => {
    const getCurrentPosition = vi.fn();
    mockGeolocation({ getCurrentPosition });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.coordinates).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("passe à requesting puis granted au succès, avec des options de précision modestes (§20)", () => {
    const getCurrentPosition = vi.fn(
      (onSuccess: PositionCallback, _onError?: PositionErrorCallback, _options?: PositionOptions) => {
        onSuccess({
          coords: { latitude: 31.8, longitude: 35.2 },
        } as GeolocationPosition);
      }
    );
    mockGeolocation({ getCurrentPosition });

    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.requestLocation());

    expect(result.current.state.status).toBe("granted");
    expect(result.current.state.coordinates).toEqual({ lat: 31.8, lng: 35.2 });

    const options = getCurrentPosition.mock.calls[0][2];
    expect(options?.enableHighAccuracy).toBe(false);
  });

  it("passe à denied quand l'utilisateur refuse la permission (code 1)", () => {
    const getCurrentPosition = vi.fn(
      (_onSuccess: PositionCallback, onError?: PositionErrorCallback) => {
        onError?.({ code: 1 } as GeolocationPositionError);
      }
    );
    mockGeolocation({ getCurrentPosition });

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());

    expect(result.current.state.status).toBe("denied");
    expect(result.current.state.coordinates).toBeNull();
  });

  it("passe à timeout (code 3) et à unavailable (code 2)", () => {
    const onErrorTimeout = vi.fn(
      (_onSuccess: PositionCallback, onError?: PositionErrorCallback) => {
        onError?.({ code: 3 } as GeolocationPositionError);
      }
    );
    mockGeolocation({ getCurrentPosition: onErrorTimeout });
    const timeoutHook = renderHook(() => useGeolocation());
    act(() => timeoutHook.result.current.requestLocation());
    expect(timeoutHook.result.current.state.status).toBe("timeout");

    const onErrorUnavailable = vi.fn(
      (_onSuccess: PositionCallback, onError?: PositionErrorCallback) => {
        onError?.({ code: 2 } as GeolocationPositionError);
      }
    );
    mockGeolocation({ getCurrentPosition: onErrorUnavailable });
    const unavailableHook = renderHook(() => useGeolocation());
    act(() => unavailableHook.result.current.requestLocation());
    expect(unavailableHook.result.current.state.status).toBe("unavailable");
  });

  it("passe directement à unavailable si l'API n'existe pas sur ce navigateur, sans jamais lancer d'erreur", () => {
    // @ts-expect-error -- simule un navigateur sans support de la géolocalisation.
    delete globalThis.navigator.geolocation;

    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestLocation());

    expect(result.current.state.status).toBe("unavailable");
  });
});

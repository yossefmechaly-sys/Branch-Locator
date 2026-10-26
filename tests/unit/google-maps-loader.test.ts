import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __resetGoogleMapsLoaderForTests,
  getGoogleMapsApiKey,
  GoogleMapsLoadError,
  loadGoogleMaps,
} from "@/lib/maps/providers/google/loader";

const SCRIPT_ID = "maayan2000-google-maps-script";

function clearInjectedScript() {
  document.getElementById(SCRIPT_ID)?.remove();
}

describe("getGoogleMapsApiKey", () => {
  const originalKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
  });

  it("renvoie null quand la variable n'est pas définie (§19 — jamais de clé en dur en repli)", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    expect(getGoogleMapsApiKey()).toBeNull();
  });

  it("renvoie null pour une valeur vide/blanche", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "   ";
    expect(getGoogleMapsApiKey()).toBeNull();
  });

  it("renvoie la clé telle quelle quand elle est définie", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key-123";
    expect(getGoogleMapsApiKey()).toBe("test-key-123");
  });
});

describe("loadGoogleMaps", () => {
  const originalKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    __resetGoogleMapsLoaderForTests();
    clearInjectedScript();
    // @ts-expect-error -- nettoyage entre tests, `google` n'est pas typé optionnel sur `Window`.
    delete window.google;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
    clearInjectedScript();
    // @ts-expect-error -- idem.
    delete window.google;
  });

  it("rejette avec GoogleMapsLoadError('missing_api_key') quand la clé est absente — sans mock, comportement réel (§19)", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    await expect(loadGoogleMaps()).rejects.toMatchObject({
      name: "GoogleMapsLoadError",
      reason: "missing_api_key",
    });
    await expect(loadGoogleMaps()).rejects.toBeInstanceOf(GoogleMapsLoadError);
    // Aucune tentative d'injection de script sans clé.
    expect(document.getElementById(SCRIPT_ID)).toBeNull();
  });

  it("résout immédiatement sans injecter de script si `window.google.maps` existe déjà (§22 : jamais de rechargement)", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    const fakeGoogle = { maps: {} } as typeof google;
    window.google = fakeGoogle;

    const resolved = await loadGoogleMaps();
    expect(resolved).toBe(fakeGoogle);
    expect(document.getElementById(SCRIPT_ID)).toBeNull();
  });

  it("injecte le script UNE SEULE FOIS et résout au déclenchement du callback global (§4)", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";

    const loadPromise = loadGoogleMaps();
    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toContain("maps.googleapis.com/maps/api/js");
    expect(script?.src).toContain("key=test-key");

    const fakeGoogle = { maps: {} } as typeof google;
    window.google = fakeGoogle;
    // Simule l'exécution du script réel : il appelle le callback global qu'il a lui-même reçu en paramètre.
    const callbackName = new URL(script!.src).searchParams.get("callback")!;
    (window[callbackName] as () => void)();

    await expect(loadPromise).resolves.toBe(fakeGoogle);

    // Un second appel ne réinjecte pas de script (promesse déjà en cache).
    await loadGoogleMaps();
    expect(document.querySelectorAll(`#${SCRIPT_ID}`)).toHaveLength(1);
  });

  it("rejette avec GoogleMapsLoadError('script_load_failed') si le script échoue à charger, et permet une nouvelle tentative (§18)", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";

    const firstAttempt = loadGoogleMaps();
    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    script?.dispatchEvent(new Event("error"));

    await expect(firstAttempt).rejects.toMatchObject({
      name: "GoogleMapsLoadError",
      reason: "script_load_failed",
    });

    // Le cache est réinitialisé après un échec : une nouvelle tentative réinjecte un script.
    clearInjectedScript();
    const secondAttempt = loadGoogleMaps();
    expect(document.getElementById(SCRIPT_ID)).not.toBeNull();

    const fakeGoogle = { maps: {} } as typeof google;
    window.google = fakeGoogle;
    const script2 = document.getElementById(SCRIPT_ID) as HTMLScriptElement;
    const callbackName = new URL(script2.src).searchParams.get("callback")!;
    (window[callbackName] as () => void)();

    await expect(secondAttempt).resolves.toBe(fakeGoogle);
  });
});

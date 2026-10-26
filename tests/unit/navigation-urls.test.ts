import { describe, expect, it } from "vitest";

import { buildWazeUrl } from "@/lib/navigation/waze";
import { buildGoogleMapsUrl } from "@/lib/navigation/google-maps";
import { buildAppleMapsUrl } from "@/lib/navigation/apple-maps";
import { isAppleDevice } from "@/lib/navigation/platform";

const TARGET = { latitude: 31.8, longitude: 35.2, address: "Ramot Blvd 1, Jerusalem" };

describe("buildWazeUrl (§9)", () => {
  it("utilise les coordonnées GPS par défaut", () => {
    expect(buildWazeUrl(TARGET)).toBe("https://waze.com/ul?ll=31.8,35.2&navigate=yes");
  });

  it("priorise un wazeUrlOverride quand présent", () => {
    const withOverride = { ...TARGET, wazeUrlOverride: "https://waze.com/ul/custom-link" };
    expect(buildWazeUrl(withOverride)).toBe("https://waze.com/ul/custom-link");
  });

  it("ignore un override null/vide et retombe sur les coordonnées", () => {
    expect(buildWazeUrl({ ...TARGET, wazeUrlOverride: null })).toBe(
      "https://waze.com/ul?ll=31.8,35.2&navigate=yes"
    );
  });
});

describe("buildGoogleMapsUrl (§10)", () => {
  it("utilise les coordonnées GPS dans une URL publique sans clé API", () => {
    const url = buildGoogleMapsUrl(TARGET);
    expect(url).toBe("https://www.google.com/maps/dir/?api=1&destination=31.8%2C35.2");
    expect(url).not.toContain("key=");
  });

  it("retombe sur l'adresse si les coordonnées sont invalides", () => {
    const url = buildGoogleMapsUrl({ ...TARGET, latitude: NaN, longitude: NaN });
    expect(url).toContain(encodeURIComponent(TARGET.address).replace(/%20/g, "+"));
  });
});

describe("buildAppleMapsUrl (§11)", () => {
  it("utilise les coordonnées GPS", () => {
    const url = buildAppleMapsUrl(TARGET);
    expect(url).toBe("https://maps.apple.com/?daddr=31.8%2C35.2&dirflg=d");
  });

  it("retombe sur l'adresse si les coordonnées sont invalides", () => {
    const url = buildAppleMapsUrl({ ...TARGET, latitude: NaN, longitude: NaN });
    expect(url).toContain(encodeURIComponent(TARGET.address).replace(/%20/g, "+"));
  });
});

describe("isAppleDevice (§12 — détection non critique)", () => {
  it("détecte iPhone/iPad/iPod/Mac", () => {
    expect(isAppleDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(isAppleDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(true);
  });

  it("retourne faux pour Android/Windows", () => {
    expect(isAppleDevice("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
    expect(isAppleDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
  });
});

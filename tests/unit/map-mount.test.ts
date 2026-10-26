import { describe, expect, it } from "vitest";

import { shouldMountGoogleMap } from "@/lib/maps/mount";

describe("shouldMountGoogleMap", () => {
  it("monte toujours la carte sur desktop, quel que soit l'onglet mobile (§10 : split permanent)", () => {
    expect(shouldMountGoogleMap({ isDesktop: true, mobileTab: "list", hasOpenedMapOnce: false })).toBe(true);
    expect(shouldMountGoogleMap({ isDesktop: true, mobileTab: "map", hasOpenedMapOnce: false })).toBe(true);
  });

  it("ne monte pas la carte sur mobile tant que l'onglet Liste n'a jamais été quitté (§4)", () => {
    expect(shouldMountGoogleMap({ isDesktop: false, mobileTab: "list", hasOpenedMapOnce: false })).toBe(false);
  });

  it("monte la carte dès que l'onglet mobile passe sur Carte", () => {
    expect(shouldMountGoogleMap({ isDesktop: false, mobileTab: "map", hasOpenedMapOnce: false })).toBe(true);
  });

  it("garde la carte montée après un retour à l'onglet Liste (§22 : pas de rechargement du SDK)", () => {
    expect(shouldMountGoogleMap({ isDesktop: false, mobileTab: "list", hasOpenedMapOnce: true })).toBe(true);
  });
});

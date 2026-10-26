import { describe, expect, it } from "vitest";

import { clampZoom, computeBounds } from "@/lib/maps/coordinates";
import { MAP_ZOOM_LIMITS } from "@/lib/maps/types";

describe("computeBounds", () => {
  it("renvoie null pour une liste vide (aucun magasin dans les résultats filtrés)", () => {
    expect(computeBounds([])).toBeNull();
  });

  it("renvoie des bounds réduites à un point pour un seul magasin", () => {
    const bounds = computeBounds([{ lat: 31.77, lng: 35.21 }]);
    expect(bounds).toEqual({ north: 31.77, south: 31.77, east: 35.21, west: 35.21 });
  });

  it("englobe tous les points fournis", () => {
    const bounds = computeBounds([
      { lat: 31.77, lng: 35.21 }, // Jérusalem
      { lat: 32.08, lng: 34.78 }, // Tel Aviv
      { lat: 29.55, lng: 34.95 }, // Eilat
    ]);
    expect(bounds).toEqual({ north: 32.08, south: 29.55, east: 35.21, west: 34.78 });
  });

  it("gère des coordonnées négatives (longitudes ouest) sans se tromper de sens", () => {
    const bounds = computeBounds([
      { lat: -10, lng: -20 },
      { lat: 5, lng: 15 },
    ]);
    expect(bounds).toEqual({ north: 5, south: -10, east: 15, west: -20 });
  });
});

describe("clampZoom", () => {
  it("laisse un zoom déjà dans les limites inchangé", () => {
    expect(clampZoom(10)).toBe(10);
  });

  it("remonte un zoom trop faible au minimum (§5 : éviter une vue trop large)", () => {
    expect(clampZoom(2)).toBe(MAP_ZOOM_LIMITS.min);
  });

  it("redescend un zoom trop fort au maximum (§5 : éviter un zoom excessif)", () => {
    expect(clampZoom(20)).toBe(MAP_ZOOM_LIMITS.max);
  });

  it("accepte des limites personnalisées", () => {
    expect(clampZoom(3, { min: 4, max: 8 })).toBe(4);
    expect(clampZoom(12, { min: 4, max: 8 })).toBe(8);
  });
});

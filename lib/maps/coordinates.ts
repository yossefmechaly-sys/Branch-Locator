import { MAP_ZOOM_LIMITS, type MapBounds, type MapCoordinates } from "./types";

/**
 * Calcul de bounds — fonction pure, ne dépend d'aucun SDK cartographique.
 * Testable sans charger Google Maps (`tests/unit/map-coordinates.test.ts`).
 *
 * Renvoie `null` pour un ensemble vide (rien à cadrer). Pour un point unique,
 * les bounds ont une étendue nulle — c'est à l'appelant (`BranchMap`, via
 * l'adaptateur Google) de choisir un zoom raisonnable dans ce cas plutôt que de
 * zoomer sur un point infinitésimal, via `clampZoom()` ci-dessous.
 */
export function computeBounds(points: readonly MapCoordinates[]): MapBounds | null {
  if (points.length === 0) return null;

  let north = points[0].lat;
  let south = points[0].lat;
  let east = points[0].lng;
  let west = points[0].lng;

  for (const point of points) {
    if (point.lat > north) north = point.lat;
    if (point.lat < south) south = point.lat;
    if (point.lng > east) east = point.lng;
    if (point.lng < west) west = point.lng;
  }

  return { north, south, east, west };
}

/** Empêche un zoom hors des bornes définies pour le Store Locator (§5). */
export function clampZoom(
  zoom: number,
  limits: { min: number; max: number } = MAP_ZOOM_LIMITS
): number {
  return Math.min(limits.max, Math.max(limits.min, zoom));
}

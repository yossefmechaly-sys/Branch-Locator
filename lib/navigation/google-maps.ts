import type { NavigationTarget } from "./types";

/**
 * URL Google Maps (navigation) pour un magasin (§10 Phase 6). Utilise le
 * format public `google.com/maps/dir/?api=1` (documenté, sans clé API), qui
 * fonctionne aussi bien sur mobile (ouvre l'app Google Maps si installée) que
 * sur desktop (ouvre maps.google.com) — pas d'appel à une API Google
 * supplémentaire, uniquement une URL (§28).
 *
 * Coordonnées GPS prioritaires (plus fiable qu'un géocodage d'adresse) ; en
 * absence de coordonnées valides, `destination` retombe sur l'adresse texte.
 */
export function buildGoogleMapsUrl(target: NavigationTarget): string {
  const hasCoordinates = Number.isFinite(target.latitude) && Number.isFinite(target.longitude);
  const destination = hasCoordinates
    ? `${target.latitude},${target.longitude}`
    : target.address;

  const params = new URLSearchParams({
    api: "1",
    destination,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

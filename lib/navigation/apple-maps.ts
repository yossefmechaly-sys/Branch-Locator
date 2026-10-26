import type { NavigationTarget } from "./types";

/**
 * URL Apple Maps pour un magasin (§11 Phase 6) — utilisée sur iOS/macOS ou
 * proposée en option secondaire ailleurs (§12). Format public `maps.apple.com`
 * (aucune clé API). Coordonnées GPS prioritaires, adresse en repli.
 */
export function buildAppleMapsUrl(target: NavigationTarget): string {
  const hasCoordinates = Number.isFinite(target.latitude) && Number.isFinite(target.longitude);
  const params = new URLSearchParams({
    ...(hasCoordinates
      ? { daddr: `${target.latitude},${target.longitude}` }
      : { daddr: target.address }),
    dirflg: "d",
  });
  return `https://maps.apple.com/?${params.toString()}`;
}

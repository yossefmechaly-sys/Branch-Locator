import type { MapCoordinates } from "@/lib/maps/types";
import type { AppLocale } from "@/types/i18n";
import type { BranchSummary } from "@/types/branch";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distance à vol d'oiseau entre deux points GPS (formule de Haversine) — pas
 * d'appel réseau, pas de dépendance à Google Routes/Distance Matrix (§3/§28
 * Phase 6, impératif : la distance affichée reste une approximation à vol
 * d'oiseau, jamais un temps/une distance de trajet réel).
 */
export function haversineDistanceMeters(a: MapCoordinates, b: MapCoordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Formatage localisé (§3) — mètres en dessous de 1 km, kilomètres au-dessus,
 * via `Intl.NumberFormat` (aucune unité codée en dur). Fonction PARTAGÉE :
 * `DistanceBadge` (Phase 4) et `BranchPopup` (Phase 5) l'utilisent toutes les
 * deux plutôt que de dupliquer la logique de formatage (§15, ne pas dupliquer
 * le calcul de distance).
 */
export function formatDistanceMeters(distanceMeters: number, locale: AppLocale): string {
  if (distanceMeters < 1000) {
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "meter",
      unitDisplay: "short",
      maximumFractionDigits: 0,
    }).format(distanceMeters);
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "kilometer",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(distanceMeters / 1000);
}

/**
 * Annote chaque magasin avec sa distance depuis `userLocation` (Haversine) et
 * trie par proximité croissante — sans jamais retirer/réordonner autrement un
 * magasin (recherche/filtres déjà appliqués en amont par `useBranches`, cette
 * fonction ne fait QUE distance + tri, §4). Si `userLocation` est `null`, les
 * magasins sont retournés inchangés (`distanceMeters` reste `null`), pour que
 * la recherche par ville/adresse continue de fonctionner sans géolocalisation
 * (§7/§27 : aucune fonctionnalité existante ne dépend de la position).
 */
export function applyUserDistance(
  branches: BranchSummary[],
  userLocation: MapCoordinates | null
): BranchSummary[] {
  if (!userLocation) return branches;

  return branches
    .map((branch) => ({
      ...branch,
      distanceMeters: haversineDistanceMeters(userLocation, {
        lat: branch.latitude,
        lng: branch.longitude,
      }),
    }))
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
}

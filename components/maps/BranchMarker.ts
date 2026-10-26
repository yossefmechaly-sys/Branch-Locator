import { buildBranchMarkerIconSpec, buildUserLocationMarkerIconSpec, type MarkerVisualState } from "@/lib/maps/icon";
import { toGoogleIcon } from "@/lib/maps/providers/google/icon";
import type { MapCoordinates } from "@/lib/maps/types";
import type { BranchStatus } from "@/types/opening-hours";

/**
 * Fabrique/mise à jour des marqueurs Google — impératif par nature (l'API
 * Google Maps ne s'exprime pas en JSX), donc volontairement en dehors de React.
 * `BranchMap.tsx` orchestre ces fonctions dans des `useEffect`, mais ne
 * construit jamais lui-même un `google.maps.Marker`.
 *
 * Un seul marqueur créé par magasin, réutilisé pour toute sa durée de vie sur
 * la carte (`setBranchMarkerState` ne fait que changer l'icône) — jamais
 * recréé à chaque rendu (§22).
 */
export interface BranchMarkerData {
  id: string;
  position: MapCoordinates;
  status: BranchStatus;
  /** Nom affiché dans la infobulle native du survol (accessibilité clavier de
   * base, indépendante de `BranchPopup` — §23). */
  title: string;
}

export interface CreateBranchMarkerOptions {
  maps: typeof google.maps;
  map: google.maps.Map;
  branch: BranchMarkerData;
  initialState?: MarkerVisualState;
  onClick: (branchId: string) => void;
  onMouseOver: (branchId: string) => void;
  onMouseOut: (branchId: string) => void;
}

export function createBranchMarker({
  maps,
  map,
  branch,
  initialState = "default",
  onClick,
  onMouseOver,
  onMouseOut,
}: CreateBranchMarkerOptions): google.maps.Marker {
  const marker = new maps.Marker({
    position: branch.position,
    map,
    title: branch.title,
    icon: toGoogleIcon(buildBranchMarkerIconSpec(branch.status, initialState), maps),
    zIndex: initialState === "selected" ? 999 : undefined,
    // Le clavier peut donner le focus au marqueur puis activer via Entrée/Espace
    // (comportement natif Google Maps pour `optimized: false` + `clickable`).
    optimized: false,
  });

  marker.addListener("click", () => onClick(branch.id));
  marker.addListener("mouseover", () => onMouseOver(branch.id));
  marker.addListener("mouseout", () => onMouseOut(branch.id));

  return marker;
}

/** Change uniquement l'icône (et l'ordre d'empilement) d'un marqueur existant
 * — jamais de recréation, pour rester bon marché même avec beaucoup de
 * magasins (§22). */
export function setBranchMarkerState(
  marker: google.maps.Marker,
  maps: typeof google.maps,
  status: BranchStatus,
  state: MarkerVisualState
): void {
  marker.setIcon(toGoogleIcon(buildBranchMarkerIconSpec(status, state), maps));
  marker.setZIndex(state === "selected" ? 999 : undefined);
}

/**
 * Marqueur de position utilisateur — préparé pour la Phase 6, pas encore
 * utilisé (§16 : aucune géolocalisation déclenchée dans cette phase). Un
 * marqueur distinct des magasins (point bleu), jamais cliquable.
 */
export function createUserLocationMarker(
  maps: typeof google.maps,
  map: google.maps.Map,
  position: MapCoordinates
): google.maps.Marker {
  return new maps.Marker({
    position,
    map,
    icon: toGoogleIcon(buildUserLocationMarkerIconSpec(), maps),
    clickable: false,
    zIndex: 1000,
  });
}

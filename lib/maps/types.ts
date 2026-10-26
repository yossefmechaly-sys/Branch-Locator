/**
 * Types cartographiques indépendants de tout fournisseur (§21 de la Phase 5).
 *
 * Les composants métier (`BranchLocator`, `BranchList`, `BranchCard`…) et la
 * logique pure de ce dossier ne manipulent QUE ces types — jamais
 * `google.maps.LatLng`/`LatLngBounds` directement. Les conversions vers l'API
 * d'un fournisseur concret vivent uniquement sous `lib/maps/providers/<fournisseur>/`
 * et `components/maps/` (marqueurs, clustering). Migrer vers un autre fournisseur
 * (Mapbox, MapLibre…) plus tard ne demanderait donc de toucher qu'à ces deux
 * dossiers, jamais à `BranchLocator`/`BranchList`/`BranchCard`.
 */
export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Contraintes de zoom communes à toute carte du Store Locator (§5). */
export const MAP_ZOOM_LIMITS = {
  min: 6,
  /** Empêche un zoom excessif quand `fitBounds` ne voit qu'un seul magasin. */
  max: 16,
} as const;

/** Centre par défaut (Israël) et zoom associé, utilisés tant qu'aucun magasin
 * n'est disponible pour calculer des bounds réels (§5). */
export const DEFAULT_MAP_CENTER: MapCoordinates = { lat: 31.5, lng: 34.85 };
export const DEFAULT_MAP_ZOOM = 7;

/** Zoom appliqué quand un magasin est sélectionné (liste ou carte) et que le
 * zoom courant est plus large que ça — assez proche pour situer le magasin
 * dans sa rue, sans dépasser `MAP_ZOOM_LIMITS.max` (§8). */
export const SELECTED_BRANCH_ZOOM = 14;

/** Marge (px) laissée autour des bounds calculées, pour que les marqueurs en
 * bord de carte ne soient jamais collés au cadre (§5). */
export const MAP_BOUNDS_PADDING_PX = 56;

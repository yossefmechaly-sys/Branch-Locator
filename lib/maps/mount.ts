/**
 * Décide si `BranchMap` doit être monté — logique pure, testable sans DOM ni
 * Google Maps (§24). Isolée de `BranchLocator` pour que la règle « ne pas
 * charger la carte tant qu'elle n'est pas nécessaire » (§4) reste vérifiable
 * indépendamment du câblage React.
 *
 * - Desktop : la carte fait partie du split permanent 40/60 (Phase 4, §10) —
 *   toujours montée.
 * - Mobile : la liste est prioritaire (§10) ; la carte n'est montée que
 *   lorsque l'utilisateur bascule sur l'onglet « Carte » — puis reste montée
 *   (`hasOpenedMapOnce`) pour ne pas la recharger à chaque va-et-vient entre
 *   les onglets (§22 : éviter le rechargement du script).
 */
export interface ShouldMountGoogleMapInput {
  isDesktop: boolean;
  mobileTab: "list" | "map";
  hasOpenedMapOnce: boolean;
}

export function shouldMountGoogleMap({ isDesktop, mobileTab, hasOpenedMapOnce }: ShouldMountGoogleMapInput): boolean {
  if (isDesktop) return true;
  return mobileTab === "map" || hasOpenedMapOnce;
}

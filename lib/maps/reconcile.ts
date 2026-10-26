/**
 * Diff pur entre les marqueurs déjà posés sur la carte et les magasins
 * réellement affichés après recherche/filtres — extrait de `BranchMap.tsx`
 * pour rester testable sans DOM ni `google.maps.*` (§24 : « filtrage des
 * marqueurs » est un des tests minimaux attendus de la Phase 5).
 *
 * `BranchMap` ne recrée JAMAIS un marqueur déjà existant (§22) : ce calcul ne
 * décide que ce qu'il faut ajouter/retirer, jamais de tout reconstruire.
 */
export interface MarkerIdDiff {
  toAdd: string[];
  toRemove: string[];
}

export function diffMarkerIds(existingIds: Iterable<string>, nextIds: readonly string[]): MarkerIdDiff {
  const nextSet = new Set(nextIds);
  const existingSet = new Set(existingIds);

  return {
    toAdd: nextIds.filter((id) => !existingSet.has(id)),
    toRemove: Array.from(existingSet).filter((id) => !nextSet.has(id)),
  };
}

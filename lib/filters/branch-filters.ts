/**
 * Filtres du Store Locator — logique pure, séparée de la recherche texte
 * (`lib/search`) et de la récupération des données (`services/`), conformément au
 * découpage strict demandé pour la Phase 4 (§7).
 */
export interface BranchFilterState {
  citySlug: string | null;
  serviceSlug: string | null;
  isOpenNow: boolean;
}

export const defaultBranchFilterState: BranchFilterState = {
  citySlug: null,
  serviceSlug: null,
  isOpenNow: false,
};

export function hasActiveBranchFilters(filters: BranchFilterState): boolean {
  return filters.citySlug !== null || filters.serviceSlug !== null || filters.isOpenNow;
}

export interface FilterableBranch {
  citySlug: string;
  serviceSlugs: readonly string[];
  /** Magasin physiquement ouvert au moment du calcul (statut OPEN ou CLOSING_SOON). */
  isOpenNow: boolean;
}

export function applyBranchFilters<T extends FilterableBranch>(
  branches: readonly T[],
  filters: BranchFilterState
): T[] {
  return branches.filter((branch) => {
    if (filters.citySlug && branch.citySlug !== filters.citySlug) return false;
    if (filters.serviceSlug && !branch.serviceSlugs.includes(filters.serviceSlug)) return false;
    if (filters.isOpenNow && !branch.isOpenNow) return false;
    return true;
  });
}

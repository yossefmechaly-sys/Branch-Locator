import type { BranchSummary } from "@/types/branch";
import { buildBranchStatusViewModel } from "./view-model";

/**
 * Rafraîchit le statut horaire d'une LISTE DÉJÀ CHARGÉE de magasins, sans
 * aucun appel réseau (§19/§20) — recalcule `statusViewModel` (et les champs
 * `status`/`todayHours`/`isSpecialDay`/`specialDayTitle`/`minutesUntilChange`
 * qui en découlent, gardés en plus pour tout code qui les lit directement,
 * ex. la couleur des marqueurs de `BranchMap`) à partir des horaires BRUTS
 * déjà présents sur chaque `BranchSummary` (`openingHours`/`specialHours`),
 * en réutilisant EXACTEMENT `buildBranchStatusViewModel()` — la même fonction
 * que celle appelée côté serveur dans `services/branch.service.ts` (§18 :
 * jamais une seconde implémentation du calcul, seulement un second APPEL).
 *
 * Toutes les autres propriétés du magasin (id, distance, position…) sont
 * conservées telles quelles — cette fonction ne touche jamais à l'ordre ni au
 * contenu de la liste, uniquement aux champs liés au statut.
 */
export function refreshBranchStatuses(branches: BranchSummary[], referenceDate: Date): BranchSummary[] {
  return branches.map((branch) => {
    const statusViewModel = buildBranchStatusViewModel(
      { openingHours: branch.openingHours, specialHours: branch.specialHours },
      referenceDate
    );

    return {
      ...branch,
      status: statusViewModel.status,
      todayHours: statusViewModel.todayHours,
      isSpecialDay: statusViewModel.isSpecialDay,
      specialDayTitle: statusViewModel.specialDayTitle,
      minutesUntilChange: statusViewModel.minutesUntilChange,
      statusViewModel,
    };
  });
}

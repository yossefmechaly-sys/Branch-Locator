import type { BranchStatusViewModel } from "@/types/opening-hours";
import { getBranchStatus, type GetBranchStatusInput } from "./status";
import { getClosingTime } from "./closing";
import { getNextOpeningTime } from "./next-opening";
import { isOpenStatus } from "./open-at";
import { getIsraelNow } from "./timezone";

/**
 * Compose les trois fonctions du moteur en UN SEUL objet complet, prêt à être
 * consommé par l'UI sans le moindre calcul supplémentaire (§16/§17/§21) :
 * `getBranchStatus()` (statut + horaires du jour), `getClosingTime()` (heure
 * de fermeture du créneau actif, uniquement si actuellement ouvert),
 * `getNextOpeningTime()` (prochaine ouverture, uniquement si actuellement
 * fermé). Chaque sous-fonction reçoit exactement le même `referenceDate` —
 * jamais un instant légèrement différent d'un appel à l'autre.
 *
 * C'est la SEULE fonction que `services/branch.service.ts` (calcul initial,
 * serveur) et `lib/opening-hours/live-status.ts` (rafraîchissement client,
 * §19) appellent — un seul point de composition, jamais deux implémentations
 * qui pourraient diverger (§18).
 */
export function buildBranchStatusViewModel(
  input: GetBranchStatusInput,
  referenceDate: Date = new Date()
): BranchStatusViewModel {
  const statusResult = getBranchStatus(input, referenceDate);
  const currentlyOpen = isOpenStatus(statusResult.status);

  return {
    ...statusResult,
    dayOfWeek: getIsraelNow(referenceDate).dayOfWeek,
    closingTime: currentlyOpen ? getClosingTime(input, referenceDate) : null,
    nextOpening: currentlyOpen ? null : getNextOpeningTime(input, referenceDate),
  };
}

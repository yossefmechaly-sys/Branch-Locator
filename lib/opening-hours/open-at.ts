import type { BranchStatus } from "@/types/opening-hours";
import { getBranchStatus, type GetBranchStatusInput } from "./status";

/**
 * Un magasin est considéré PHYSIQUEMENT ouvert pour `OPEN` et `CLOSING_SOON`
 * (il ferme bientôt mais accueille encore des clients maintenant) — pas pour
 * `OPENING_SOON` (pas encore ouvert). Centralisé ici pour que
 * `services/branch.service.ts` (filtre « ouvert maintenant ») et
 * `isBranchOpenAt()` ci-dessous partagent EXACTEMENT la même définition,
 * jamais deux versions divergentes de « ouvert » (§18).
 */
export function isOpenStatus(status: BranchStatus): boolean {
  return status === "OPEN" || status === "CLOSING_SOON";
}

/** Le magasin est-il ouvert à `referenceDate` ? Simple projection booléenne de
 * `getBranchStatus()` — ne réimplémente aucune règle de résolution. */
export function isBranchOpenAt(
  input: GetBranchStatusInput,
  referenceDate: Date = new Date()
): boolean {
  return isOpenStatus(getBranchStatus(input, referenceDate).status);
}

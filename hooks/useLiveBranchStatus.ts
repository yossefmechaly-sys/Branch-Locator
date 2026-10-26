"use client";

import { useMemo } from "react";

import { buildBranchStatusViewModel } from "@/lib/opening-hours/view-model";
import type { BranchStatusViewModel, OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";
import { useNowContext } from "@/components/branches/NowProvider";

/**
 * Statut horaire vivant d'UN magasin (fiche détail, Phase 8 §8) — appelle
 * EXACTEMENT `buildBranchStatusViewModel()` (moteur Phase 7, aucune
 * réimplémentation), avec le `now` partagé de `NowProvider` plutôt qu'un
 * `new Date()` local à chaque appel : `BranchStatusLive` (badge du hero) et
 * `OpeningHoursLive` (tableau des 7 jours) restent ainsi TOUJOURS en accord
 * l'un avec l'autre (même garantie que §17 Phase 7 pour liste/carte,
 * appliquée ici à deux sections d'une même page).
 *
 * `openingHours`/`specialHours` passés séparément (pas un objet unique) pour
 * que `useMemo` détecte correctement l'absence de changement entre deux
 * rendus (identité de tableau stable venant des props serveur) — seule la
 * dépendance `now` change réellement, toutes les 60 s.
 */
export function useLiveBranchStatus(
  openingHours: readonly OpeningHoursEntry[],
  specialHours: readonly SpecialHoursEntry[]
): BranchStatusViewModel {
  const now = useNowContext();
  return useMemo(
    () => buildBranchStatusViewModel({ openingHours, specialHours }, now),
    [openingHours, specialHours, now]
  );
}

"use client";

import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";
import { useLiveBranchStatus } from "@/hooks/useLiveBranchStatus";
import type { SaturdayEveningHours } from "@/types/branch";

import { BranchStatus } from "./BranchStatus";

export interface BranchStatusLiveProps {
  openingHours: readonly OpeningHoursEntry[];
  specialHours: readonly SpecialHoursEntry[];
  saturdayEveningHours?: SaturdayEveningHours | null;
  className?: string;
}

/**
 * Pont entre le `now` partagé (`NowProvider`) et `BranchStatus` (purement
 * présentationnel, Phase 7) — recalcule le `BranchStatusViewModel` toutes les
 * 60 s (§8 Phase 8 : une fiche restée ouverte longtemps ne doit jamais
 * afficher un statut périmé, ex. « ouvert » après l'heure de fermeture).
 * `BranchStatus` lui-même ne change pas : ce composant ne fait QUE lui
 * fournir un `viewModel` toujours à jour.
 */
export function BranchStatusLive({ openingHours, specialHours, saturdayEveningHours, className }: BranchStatusLiveProps) {
  const viewModel = useLiveBranchStatus(openingHours, specialHours, saturdayEveningHours);
  return <BranchStatus viewModel={viewModel} saturdayEveningHours={saturdayEveningHours} className={className} />;
}

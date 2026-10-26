"use client";

import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";
import { useLiveBranchStatus } from "@/hooks/useLiveBranchStatus";

import { OpeningHours } from "./OpeningHours";

export interface OpeningHoursLiveProps {
  openingHours: readonly OpeningHoursEntry[];
  specialHours: readonly SpecialHoursEntry[];
  className?: string;
}

/**
 * Même pont que `BranchStatusLive`, pour le tableau des 7 jours (§9 Phase 8) —
 * ne recalcule qu'une chose : `dayOfWeek` (mise en évidence du jour courant),
 * pour que la fiche reste correcte même si elle reste ouverte au moment d'un
 * changement de jour (minuit). Lit le MÊME `now` partagé que
 * `BranchStatusLive` (`NowProvider`) — un seul timer pour toute la page.
 */
export function OpeningHoursLive({ openingHours, specialHours, className }: OpeningHoursLiveProps) {
  const viewModel = useLiveBranchStatus(openingHours, specialHours);
  return (
    <OpeningHours openingHours={openingHours} currentDayOfWeek={viewModel.dayOfWeek} className={className} />
  );
}

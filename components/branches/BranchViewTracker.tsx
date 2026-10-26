"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics/track";

export interface BranchViewTrackerProps {
  branchId: string;
}

/**
 * Émet `branch_view` UNE FOIS par consultation réelle de la fiche côté client
 * (§36 Phase 8) — composant sans rendu visuel (`return null`), monté par la
 * page magasin (Server Component). Un `useEffect` plutôt qu'un appel direct
 * dans le corps de la page : la page est un Server Component, elle ne
 * s'exécute jamais dans le navigateur, donc appeler `track()` directement là-
 * bas se déclencherait à chaque rendu SERVEUR (y compris une revalidation
 * ISR, §34) et ne représenterait pas une vraie visite utilisateur — jamais de
 * donnée personnelle transmise ici, uniquement l'identifiant du magasin (§36).
 */
export function BranchViewTracker({ branchId }: BranchViewTrackerProps) {
  useEffect(() => {
    track({ name: "branch_view", branchId });
  }, [branchId]);

  return null;
}

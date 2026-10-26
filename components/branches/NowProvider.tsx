"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useNow } from "@/hooks/useNow";

/**
 * Distribue un `now` PARTAGÉ à toute la fiche magasin (Phase 8, §8/§20) — la
 * fiche affiche le statut/l'horaire courant à DEUX endroits distincts de
 * l'arbre serveur (le badge du hero, et le tableau des 7 jours plus bas) :
 * plutôt que deux composants clients appelant chacun leur propre `useNow()`
 * (deux `setInterval` pour une seule page), un SEUL `useNow()` ici, dont la
 * valeur descend par contexte à `BranchStatusLive`/`OpeningHoursLive` — un
 * seul timer central pour toute la fiche (même principe que le timer unique
 * de `BranchLocator`, Phase 7 §20, appliqué ici à deux emplacements d'UNE
 * MÊME page plutôt qu'à une liste de magasins).
 *
 * Ne réutilise PAS `hooks/useNow.ts` lui-même différemment — ce Provider
 * l'appelle une seule fois et le republie, sans en dupliquer la logique.
 */
const NowContext = createContext<Date | null>(null);

export function NowProvider({ children }: { children: ReactNode }) {
  const now = useNow();
  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

/** `new Date()` de repli si un composant lit ce contexte hors `NowProvider`
 * (ne devrait jamais arriver dans la fiche magasin) — mieux vaut une valeur
 * fraîche isolée qu'un crash (§37 : tolérance aux états inattendus). */
export function useNowContext(): Date {
  const now = useContext(NowContext);
  return now ?? new Date();
}

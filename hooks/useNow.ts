"use client";

import { useEffect, useState } from "react";
import { STATUS_REFRESH_INTERVAL_MS } from "@/lib/opening-hours/config";

/**
 * Horloge partagée UNIQUE (§20 Phase 7) — un seul `setInterval` pour tout le
 * Store Locator, jamais un timer par `BranchCard`/`BranchPopup`. Appelé une
 * seule fois dans `BranchLocator`, qui redistribue le `now` résultant à
 * `refreshBranchStatuses()` (`lib/opening-hours/live-status.ts`) pour
 * recalculer tous les statuts en une fois (§19 : une page ouverte longtemps
 * ne doit jamais rester bloquée sur un statut périmé).
 *
 * `setState` est déclenché toutes les `STATUS_REFRESH_INTERVAL_MS` (60 s par
 * défaut, config centrale) — pas plus fréquent, pour rester léger (§20) et ne
 * jamais requêter le réseau : seul du recalcul local sur des données déjà en
 * mémoire.
 */
export function useNow(intervalMs: number = STATUS_REFRESH_INTERVAL_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

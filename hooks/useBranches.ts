"use client";

import { useEffect, useRef, useState } from "react";

import { classifySearch } from "@/lib/analytics/search-classification";
import { track } from "@/lib/analytics/track";
import type { AppLocale } from "@/types/i18n";
import type { BranchLocatorResult } from "@/types/branch";
import type { BranchFilterState } from "@/lib/filters/branch-filters";

import { useDebouncedValue } from "./useDebouncedValue";

export type BranchesFetchStatus = "loading" | "success" | "error";

export interface UseBranchesParams {
  locale: AppLocale;
  query: string;
  filters: BranchFilterState;
  /** Résultat déjà résolu côté serveur (`app/[locale]/branches/page.tsx`) — évite
   * un aller-retour réseau superflu pour l'état initial de la page. */
  initialData: BranchLocatorResult;
}

export interface UseBranchesResult {
  data: BranchLocatorResult;
  status: BranchesFetchStatus;
  error: string | null;
  refetch: () => void;
}

/**
 * Récupère les magasins depuis `GET /api/branches`, avec anti-rebond de la
 * recherche texte (300 ms) et annulation de toute requête devenue obsolète
 * (l'utilisateur tape plus vite que le réseau ne répond).
 *
 * Ne fait AUCUNE requête au montage : la toute première valeur vient de
 * `initialData` (déjà calculée côté serveur), conformément au principe « une
 * seule source de vérité, jamais de donnée dupliquée codée en dur » (§1).
 */
export function useBranches({ locale, query, filters, initialData }: UseBranchesParams): UseBranchesResult {
  const [data, setData] = useState<BranchLocatorResult>(initialData);
  const [status, setStatus] = useState<BranchesFetchStatus>("success");
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const hasMountedRef = useRef(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  // Évite de ré-émettre `search` quand un CHANGEMENT DE FILTRE (pas de la
  // requête) redéclenche cet effet avec la même `debouncedQuery` (Phase 10,
  // §3/§4) — un événement par recherche texte réellement nouvelle, jamais un
  // par filtre changé (déjà couvert séparément par `filter_used`, voir
  // `BranchLocator`).
  const lastTrackedQueryRef = useRef<string | null>(null);

  // Sérialisé pour ne redéclencher l'effet que si la valeur *logique* des
  // filtres change, pas la référence de l'objet (recréé à chaque rendu parent).
  const filtersKey = `${filters.citySlug ?? ""}|${filters.serviceSlug ?? ""}|${filters.isOpenNow ? "1" : "0"}`;

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    const params = new URLSearchParams({ locale });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (filters.citySlug) params.set("city", filters.citySlug);
    if (filters.serviceSlug) params.set("service", filters.serviceSlug);
    if (filters.isOpenNow) params.set("isOpenNow", "true");

    fetch(`/api/branches?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        return (await response.json()) as BranchLocatorResult;
      })
      .then((result) => {
        setData(result);
        setStatus("success");

        // `search` (Phase 10, §3/§4) — uniquement quand la requête texte
        // elle-même a changé (jamais pour un simple changement de filtre à
        // requête inchangée), et JAMAIS la chaîne saisie elle-même : voir
        // `lib/analytics/search-classification.ts`.
        if (debouncedQuery && debouncedQuery !== lastTrackedQueryRef.current) {
          lastTrackedQueryRef.current = debouncedQuery;
          const classification = classifySearch(debouncedQuery, result.cities, result.branches);
          track({
            name: "search",
            resultCount: classification.resultCount,
            matchType: classification.matchType,
            ...(classification.matchedCitySlug ? { matchedCitySlug: classification.matchedCitySlug } : {}),
            ...(classification.matchedBranchId ? { matchedBranchId: classification.matchedBranchId } : {}),
          });
        } else if (!debouncedQuery) {
          lastTrackedQueryRef.current = null;
        }
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        setStatus("error");
        setError(caughtError instanceof Error ? caughtError.message : "UNKNOWN_ERROR");
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `filters` est représenté par `filtersKey` (voir commentaire ci-dessus).
  }, [locale, debouncedQuery, filtersKey, refetchToken]);

  return {
    data,
    status,
    error,
    refetch: () => setRefetchToken((token) => token + 1),
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapLoadingState } from "@/components/maps/MapLoadingState";
import { useBranches } from "@/hooks/useBranches";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useIsDesktopViewport } from "@/hooks/useIsDesktopViewport";
import { useNow } from "@/hooks/useNow";
import { track } from "@/lib/analytics/track";
import { applyUserDistance } from "@/lib/geolocation/distance";
import { refreshBranchStatuses } from "@/lib/opening-hours/live-status";
import { defaultBranchFilterState, type BranchFilterState } from "@/lib/filters/branch-filters";
import { shouldMountGoogleMap } from "@/lib/maps/mount";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/types/i18n";
import type { BranchLocatorResult } from "@/types/branch";

import { BranchSearch } from "./BranchSearch";
import { BranchFilters } from "./BranchFilters";
import { BranchList } from "./BranchList";

/**
 * `BranchMap` importe le SDK Google Maps derrière un chargement différé
 * (`lib/maps/providers/google/loader.ts`) mais le composant lui-même reste un
 * chunk JS non négligeable (marqueurs, clustering, popup) — `next/dynamic`
 * avec `ssr: false` le sort du bundle initial du Store Locator (§4) ; le
 * fallback `MapLoadingState` évite un saut de mise en page pendant le
 * téléchargement du chunk.
 */
const BranchMap = dynamic(() => import("@/components/maps/BranchMap").then((mod) => mod.BranchMap), {
  ssr: false,
  loading: () => <MapLoadingState />,
});

export interface BranchLocatorProps {
  locale: AppLocale;
  initialData: BranchLocatorResult;
  initialCitySlug?: string | null;
}

/**
 * Orchestrateur (Phase 4, câblage carte étendu en Phase 5) — combine recherche,
 * filtres, liste et carte, mais ne contient AUCUNE logique de recherche/
 * filtre/statut/carte elle-même (déléguée à `lib/search`, `lib/filters`,
 * `lib/opening-hours`, `lib/maps`, via `services/branch.service.ts`,
 * `useBranches` et `BranchMap`) : ce composant ne fait que tenir l'état de
 * l'UI et brancher les callbacks (§7 Phase 4, §1/§26 Phase 5 — non réécrit).
 *
 * Layout : desktop = split permanent 40 % liste / 60 % carte (`md:grid-cols-[40%_1fr]`) ;
 * mobile = liste prioritaire, la carte est derrière un onglet (§10 Phase 4).
 * `BranchList` et `BranchMap` ne sont montés QU'UNE SEULE FOIS chacun — la
 * bascule mobile liste/carte et le split desktop sont purement des classes CSS
 * conditionnelles (`hidden`/`md:block`) appliquées au conteneur, jamais un
 * second rendu du composant. Un double montage semblait anodin (12 magasins
 * DEMO) mais casse en pratique les requêtes d'accessibilité (`getByRole`) sur
 * la copie masquée — détecté pendant la vérification Playwright de la Phase 4.
 *
 * Exception volontaire côté carte (Phase 5, §4) : sur mobile, `BranchMap`
 * n'est monté qu'après le premier passage sur l'onglet « Carte »
 * (`shouldMountGoogleMap`) — chargement différé du SDK Google, pas seulement
 * masquage CSS. Desktop : toujours monté (fait partie du split visible d'emblée).
 */
export function BranchLocator({ locale, initialData, initialCitySlug = null }: BranchLocatorProps) {
  const tMobile = useTranslations("mobileView");
  const tGeolocation = useTranslations("geolocation");
  const isDesktop = useIsDesktopViewport();

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<BranchFilterState>(() => ({
    ...defaultBranchFilterState,
    citySlug: initialCitySlug,
  }));
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [hoveredBranchId, setHoveredBranchId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");
  // Une fois vrai, le reste — jamais remis à `false` : on ne recharge pas la
  // carte/le SDK Google à chaque va-et-vient entre les onglets mobiles (§22).
  const [hasOpenedMapOnce, setHasOpenedMapOnce] = useState(false);

  const { data, status, error, refetch } = useBranches({ locale, query, filters, initialData });

  const { state: geolocationState, requestLocation } = useGeolocation();
  const userLocation = geolocationState.status === "granted" ? geolocationState.coordinates : null;

  // Store Locator : demander automatiquement la position au premier montage.
  // Si l'utilisateur accepte, `applyUserDistance()` trie ensuite les magasins
  // du plus proche au plus éloigné. En cas de refus/erreur, la liste reste
  // utilisable dans son ordre serveur et le bouton « près de moi » permet
  // toujours de réessayer manuellement.
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // `geolocation_used` (§22) : émis une seule fois par octroi réussi, jamais à
  // chaque rendu — un ref garde trace du dernier statut observé plutôt que de
  // dépendre d'un effet à chaque changement de `geolocationState` en entier
  // (qui inclurait les coordonnées, sans intérêt ici — §2, jamais envoyées).
  const previousGeolocationStatusRef = useRef(geolocationState.status);
  useEffect(() => {
    if (
      geolocationState.status === "granted" &&
      previousGeolocationStatusRef.current !== "granted"
    ) {
      track({ name: "geolocation_used" });
    }
    previousGeolocationStatusRef.current = geolocationState.status;
  }, [geolocationState.status]);

  // `locator_view` (Phase 10, §3) : une fois par montage client réel de ce
  // composant — même principe que `branch_view`/`promotion_view` (jamais côté
  // serveur, où une revalidation ISR le déclencherait sans visite réelle).
  useEffect(() => {
    track({ name: "locator_view" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois par montage, jamais à chaque rendu.
  }, []);

  // `filter_used` (§3/§11) : un événement par CHAMP réellement changé, jamais
  // un par re-rendu — comparé au `filters` précédent plutôt que déduit d'un
  // diff générique, pour ne jamais rater/dupliquer un champ.
  const handleFiltersChange = useCallback(
    (next: BranchFilterState) => {
      if (next.citySlug !== filters.citySlug) track({ name: "filter_used", filterName: "city" });
      if (next.serviceSlug !== filters.serviceSlug) track({ name: "filter_used", filterName: "service" });
      if (next.isOpenNow !== filters.isOpenNow) track({ name: "filter_used", filterName: "isOpenNow" });
      setFilters(next);
    },
    [filters]
  );

  // Distance + tri par proximité (§3/§4) — appliqués APRÈS recherche/filtres
  // (déjà résolus côté API par `useBranches`), donc les deux se combinent
  // toujours sans perte : `data.branches` reste la liste déjà filtrée, ce
  // hook ne fait qu'annoter/trier ce sous-ensemble. Inchangé (donc pas de
  // tri) tant que `userLocation` est `null`.
  const sortedBranches = useMemo(
    () => applyUserDistance(data.branches, userLocation),
    [data.branches, userLocation]
  );

  // Rafraîchissement léger du statut horaire (Phase 7, §19/§20/§21) — un seul
  // timer central (`useNow`, jamais un par `BranchCard`), qui redéclenche ce
  // recalcul toutes les 60 s. `refreshBranchStatuses()` réutilise EXACTEMENT
  // le même moteur (`buildBranchStatusViewModel`) que le serveur, à partir des
  // horaires bruts déjà reçus — jamais un nouvel appel réseau, jamais une
  // seconde implémentation du calcul. `BranchList` et `BranchMap` reçoivent
  // tous deux `liveBranches` : leur statut ne peut donc jamais diverger (§17).
  const now = useNow();
  const liveBranches = useMemo(() => refreshBranchStatuses(sortedBranches, now), [sortedBranches, now]);

  const handleMobileTabChange = useCallback((value: string) => {
    const nextTab = value as "list" | "map";
    setMobileTab(nextTab);
    if (nextTab === "map") setHasOpenedMapOnce(true);
  }, []);

  // Bouton « détails » de `BranchPopup` (§9) : la sélection déclenche déjà le
  // surlignage/défilement de la fiche dans `BranchList` (ci-dessous) — sur
  // mobile, il faut en plus revenir à l'onglet liste pour la voir.
  const handleViewDetails = useCallback((branchId: string) => {
    setSelectedBranchId(branchId);
    setMobileTab("list");
  }, []);

  const shouldMountMap = useMemo(
    () => shouldMountGoogleMap({ isDesktop, mobileTab, hasOpenedMapOnce }),
    [isDesktop, mobileTab, hasOpenedMapOnce]
  );

  // Géolocalisation réelle (§1) : `requestLocation` n'est appelé qu'ici, en
  // réponse directe à ce clic — jamais depuis un `useEffect` de ce composant
  // ou de `useGeolocation` lui-même.
  const handleRequestLocation = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  // Message traduit non bloquant (§7/§8) — un seul par état d'échec, jamais
  // de nouvelle demande automatique de permission. Le reste du Store Locator
  // (recherche, filtres, liste, carte) continue de fonctionner sans lui (§27).
  const geolocationMessage =
    geolocationState.status === "denied"
      ? tGeolocation("deniedMessage")
      : geolocationState.status === "unavailable"
        ? tGeolocation("unavailableMessage")
        : geolocationState.status === "timeout"
          ? tGeolocation("timeoutMessage")
          : geolocationState.status === "error"
            ? tGeolocation("errorMessage")
            : null;

  const branchListProps = {
    branches: liveBranches,
    status,
    locale,
    selectedBranchId,
    onSelectBranch: setSelectedBranchId,
    onHoverBranch: setHoveredBranchId,
    onRetry: refetch,
  };

  const mapProps = {
    branches: liveBranches,
    selectedBranchId,
    onSelectBranch: setSelectedBranchId,
    hoveredBranchId,
    onHoverBranch: setHoveredBranchId,
    locale,
    onViewDetails: handleViewDetails,
    userLocation,
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <BranchSearch
          value={query}
          onChange={setQuery}
          onRequestLocation={handleRequestLocation}
          geolocationStatus={geolocationState.status}
        />
      </div>

      {/* Message non bloquant (§7/§8) — n'empêche jamais la recherche/les
          filtres/la liste/la carte de fonctionner (§27). */}
      {geolocationMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {geolocationMessage}
        </p>
      )}

      <BranchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        cities={data.cities}
        services={data.services}
      />

      {error && (
        <p role="alert" className="sr-only">
          {error}
        </p>
      )}

      {/* Bascule liste/carte — visible seulement en dessous de `md` (§10). Pilote
          `mobileTab`, mais ne monte ni ne démonte rien elle-même : c'est la grille
          ci-dessous qui affiche/masque `BranchList`/`BranchMap` via CSS. */}
      <Tabs value={mobileTab} onValueChange={handleMobileTabChange} className="md:hidden">
        <TabsList className="w-full">
          <TabsTrigger value="list" className="flex-1">
            {tMobile("list")}
          </TabsTrigger>
          <TabsTrigger value="map" className="flex-1">
            {tMobile("map")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Mobile (< md) : un seul des deux blocs visible, selon `mobileTab`.
          Desktop (≥ md) : les deux visibles simultanément, 40 % / 60 % (§9/§10). */}
      <div className="grid gap-6 md:grid-cols-[40%_1fr] md:items-start">
        <div className={cn(mobileTab !== "list" && "hidden", "md:block")}>
          <BranchList {...branchListProps} />
        </div>
        <div className={cn(mobileTab !== "map" && "hidden", "md:sticky md:top-20 md:block")}>
          {/* Sur mobile, la carte n'est montée qu'après le premier passage sur
              l'onglet « Carte » (§4) — `shouldMountMap` le décide une fois pour
              toutes ; le bloc reste ensuite monté même si l'onglet redevient
              « Liste » (§22 : pas de rechargement du SDK). Ce bloc n'est de
              toute façon jamais visible tant que `shouldMountMap` est faux : à
              ce stade `mobileTab !== "map"`, donc le conteneur ci-dessus porte
              déjà `hidden`. */}
          {shouldMountMap && <BranchMap {...mapProps} />}
        </div>
      </div>
    </div>
  );
}

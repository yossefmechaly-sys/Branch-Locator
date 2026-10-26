"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider, useMessages, useTranslations } from "next-intl";

import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDirection } from "@/types/i18n";
import type { BranchMapViewProps } from "@/types/map";
import type { BranchSummary } from "@/types/branch";
import { computeBounds, clampZoom } from "@/lib/maps/coordinates";
import { diffMarkerIds } from "@/lib/maps/reconcile";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_BOUNDS_PADDING_PX,
  MAP_ZOOM_LIMITS,
  SELECTED_BRANCH_ZOOM,
} from "@/lib/maps/types";
import { GoogleMapsLoadError, loadGoogleMaps } from "@/lib/maps/providers/google/loader";
import { useIsDesktopViewport } from "@/hooks/useIsDesktopViewport";
import { track } from "@/lib/analytics/track";

import { createBranchMarker, createUserLocationMarker, setBranchMarkerState } from "./BranchMarker";
import { createBranchCluster, type BranchClusterHandle } from "./BranchCluster";
import { BranchPopup } from "./BranchPopup";
import { MapLoadingState } from "./MapLoadingState";
import { MapErrorState } from "./MapErrorState";

type LoadState =
  | { status: "loading" }
  | { status: "error"; reason: "missing_api_key" | "load_failed" }
  | { status: "ready" };

/**
 * Carte Google Maps réelle — implémente `BranchMapViewProps`, exactement
 * comme le faisait `MapPlaceholder` en Phase 4, pour que `BranchLocator`
 * n'ait rien à changer à son câblage liste ↔ carte (§1).
 *
 * Toute l'API Google (`google.maps.*`) reste confinée à ce fichier et à
 * `BranchMarker.ts`/`BranchCluster.ts`/`providers/google/*` — jamais exposée
 * à `BranchLocator`/`BranchList`/`BranchCard` (§21).
 *
 * Cycle de vie volontairement en trois temps, chacun son `useEffect` :
 *  1. Charger le SDK (`loadGoogleMaps`) — jamais bloquant pour le reste du
 *     Store Locator (§18), ré-essayable (`retryToken`).
 *  2. Créer `google.maps.Map` UNE SEULE FOIS quand le SDK est prêt (§22).
 *  3. Réconcilier les marqueurs avec `branches` à chaque changement de
 *     recherche/filtre (§12/§13), sans jamais recréer la carte ni les
 *     marqueurs déjà existants.
 * La sélection/le survol (venant de la liste OU d'un clic sur un marqueur)
 * sont gérés par deux effets séparés, légers, qui ne touchent jamais aux
 * marqueurs non concernés (§22).
 *
 * Phase 6 (§5/§6/§29) : un effet SUPPLÉMENTAIRE et INDÉPENDANT gère le
 * marqueur de position utilisateur + le recentrage — délibérément séparé de
 * l'effet de réconciliation ci-dessus plutôt que d'y être fusionné, pour ne
 * modifier AUCUN comportement déjà validé en Phase 5 (§29 : « ne pas
 * refactoriser, expliquer si un changement structurel est indispensable »).
 * Il ne se déclenche qu'au changement de `userLocation` (une seule fois par
 * demande de géolocalisation, jamais en continu — §19), jamais à chaque
 * recherche/filtre.
 */
export function BranchMap({
  branches,
  selectedBranchId,
  onSelectBranch,
  hoveredBranchId = null,
  onHoverBranch,
  locale,
  onViewDetails,
  userLocation = null,
  className,
}: BranchMapViewProps) {
  const t = useTranslations("map");
  // `createRoot()` (popup desktop, ci-dessous) démarre un arbre React
  // totalement séparé de celui de l'application : le contexte de
  // `NextIntlClientProvider` ne le traverse PAS. `useMessages()` capture ici
  // le catalogue courant (dans l'arbre normal, où le contexte existe bel et
  // bien) pour le refournir explicitement à ce sous-arbre détaché.
  const messages = useMessages();
  const isDesktop = useIsDesktopViewport();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapsApiRef = useRef<typeof google.maps | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const clusterRef = useRef<BranchClusterHandle | null>(null);
  const userLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowRootRef = useRef<Root | null>(null);
  const infoWindowContainerRef = useRef<HTMLDivElement | null>(null);
  const hasFitOnceRef = useRef(false);
  const prevSelectedRef = useRef<string | null>(null);
  const prevHoveredRef = useRef<string | null>(null);
  const isDesktopRef = useRef(isDesktop);

  // Callbacks toujours à jour, lus par des écouteurs Google enregistrés UNE
  // SEULE FOIS (clic/survol marqueur, fermeture d'InfoWindow) — évite de
  // recréer marqueurs/InfoWindow à chaque changement d'identité de callback
  // (§22). Mis à jour via un effet sans dépendances (après chaque rendu,
  // avant tout événement utilisateur) plutôt que pendant le rendu lui-même —
  // règle `react-hooks/refs`.
  const onSelectBranchRef = useRef(onSelectBranch);
  const onHoverBranchRef = useRef(onHoverBranch);
  const onViewDetailsRef = useRef(onViewDetails);

  useEffect(() => {
    onSelectBranchRef.current = onSelectBranch;
    onHoverBranchRef.current = onHoverBranch;
    onViewDetailsRef.current = onViewDetails;
    isDesktopRef.current = isDesktop;
  });

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);
  const isFirstLoadRef = useRef(true);

  const handleRetry = useCallback(() => setRetryToken((token) => token + 1), []);

  const handleViewDetails = useCallback(
    (branchId: string) => {
      onViewDetailsRef.current?.(branchId);
    },
    []
  );

  const formatClusterTitle = useCallback((count: number) => t("clusterCount", { count }), [t]);

  // 1. Chargement du SDK — §4/§18/§19. L'état initial (`useState` ci-dessus)
  // vaut déjà `{status: "loading"}` : on ne le redéfinit qu'à partir de la
  // deuxième exécution (une nouvelle tentative après échec), pour ne jamais
  // déclencher de `setState` synchrone redondant au montage.
  useEffect(() => {
    let cancelled = false;
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
    } else {
      setLoadState({ status: "loading" });
    }

    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setLoadState({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const reason =
          error instanceof GoogleMapsLoadError && error.reason === "missing_api_key"
            ? "missing_api_key"
            : "load_failed";
        setLoadState({ status: "error", reason });
      });

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  // 2. Instance de carte — créée une seule fois, jamais recréée aux
  // changements de `branches`/sélection (§22). Centre/zoom par défaut =
  // Israël (§5) ; affinés par le fitBounds de l'effet de réconciliation.
  useEffect(() => {
    if (loadState.status !== "ready" || !containerRef.current || mapRef.current) return;

    const maps = window.google.maps;
    mapsApiRef.current = maps;
    mapRef.current = new maps.Map(containerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      // Respecté aussi par `fitBounds` (comportement documenté de l'API) —
      // empêche un zoom excessif même sur un seul magasin (§5).
      minZoom: MAP_ZOOM_LIMITS.min,
      maxZoom: MAP_ZOOM_LIMITS.max,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      clickableIcons: false,
    });
  }, [loadState.status]);

  // Clé stable représentant l'ensemble de magasins réellement affichés — ne
  // change que si un identifiant est ajouté/retiré (recherche, filtres),
  // jamais pour un simple recalcul de statut/distance (§22 : pas de
  // recalcul de bounds superflu).
  const idsKey = useMemo(() => branches.map((branch) => branch.id).sort().join(","), [branches]);

  // 3. Réconciliation marqueurs + clustering + bounds — reflète exactement
  // les résultats filtrés (§12/§13).
  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;

    const markers = markersRef.current;
    const { toAdd, toRemove } = diffMarkerIds(markers.keys(), branches.map((branch) => branch.id));

    for (const id of toRemove) {
      const marker = markers.get(id);
      if (!marker) continue;
      maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
      markers.delete(id);
    }

    const branchesToAdd = new Set(toAdd);
    for (const branch of branches) {
      if (!branchesToAdd.has(branch.id)) continue;
      const marker = createBranchMarker({
        maps,
        map,
        branch: {
          id: branch.id,
          position: { lat: branch.latitude, lng: branch.longitude },
          status: branch.status,
          title: branch.displayName,
        },
        initialState: branch.id === prevSelectedRef.current ? "selected" : "default",
        onClick: (branchId) => {
          // Phase 10, §3.
          track({ name: "map_marker_click", branchId });
          onSelectBranchRef.current(branchId);
        },
        onMouseOver: (branchId) => onHoverBranchRef.current?.(branchId),
        onMouseOut: () => onHoverBranchRef.current?.(null),
      });
      markers.set(branch.id, marker);
    }

    if (!clusterRef.current) {
      clusterRef.current = createBranchCluster({
        maps,
        map,
        markers: Array.from(markers.values()),
        locale,
        formatTitle: formatClusterTitle,
      });
    } else {
      clusterRef.current.setMarkers(Array.from(markers.values()));
    }

    const bounds = computeBounds(branches.map((branch) => ({ lat: branch.latitude, lng: branch.longitude })));
    if (bounds) {
      const googleBounds = new maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );
      map.fitBounds(googleBounds, MAP_BOUNDS_PADDING_PX);
      // Filet de sécurité indépendant du provider (§5/§21) : `maxZoom` sur la
      // carte suffit normalement, mais on vérifie explicitement une fois les
      // nouvelles bounds appliquées (fitBounds est asynchrone).
      maps.event.addListenerOnce(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom === undefined) return;
        const clamped = clampZoom(currentZoom);
        if (clamped !== currentZoom) map.setZoom(clamped);
      });
    } else if (!hasFitOnceRef.current) {
      map.setCenter(DEFAULT_MAP_CENTER);
      map.setZoom(DEFAULT_MAP_ZOOM);
    }
    hasFitOnceRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `branches` est représenté par `idsKey` (voir commentaire ci-dessus) ; `locale`/`formatClusterTitle` ne doivent pas redéclencher un fitBounds.
  }, [idsKey, loadState.status]);

  // Position utilisateur + recentrage (Phase 6, §5/§6) — marqueur visuellement
  // distinct des magasins (`createUserLocationMarker`/`buildUserLocationMarkerIconSpec`,
  // anticipés en Phase 5), créé/déplacé/retiré selon `userLocation`. Le
  // recentrage inclut l'utilisateur ET les magasins visibles (pas un zoom
  // isolé sur l'utilisateur seul — §6), avec le même garde-fou de zoom que la
  // réconciliation ci-dessus.
  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!maps || !map || loadState.status !== "ready") return;

    if (!userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
        userLocationMarkerRef.current = null;
      }
      return;
    }

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setPosition(userLocation);
    } else {
      userLocationMarkerRef.current = createUserLocationMarker(maps, map, userLocation);
    }

    const points = [
      userLocation,
      ...branches.map((branch) => ({ lat: branch.latitude, lng: branch.longitude })),
    ];
    const bounds = computeBounds(points);
    if (bounds) {
      const googleBounds = new maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );
      map.fitBounds(googleBounds, MAP_BOUNDS_PADDING_PX);
      maps.event.addListenerOnce(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom === undefined) return;
        const clamped = clampZoom(currentZoom);
        if (clamped !== currentZoom) map.setZoom(clamped);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `branches` volontairement omis : ce recentrage ne doit se déclencher qu'à l'obtention/au changement de `userLocation` (une fois par demande de géolocalisation, §19), pas à chaque recherche/filtre — déjà couvert par l'effet de réconciliation ci-dessus.
  }, [userLocation, loadState.status]);

  // Sélection : centre/zoome et distingue visuellement le marqueur choisi —
  // depuis la liste (`BranchCard`) ou depuis un clic sur un marqueur (§8/§9).
  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;

    const previousId = prevSelectedRef.current;
    if (previousId === selectedBranchId) return;

    const markers = markersRef.current;

    if (previousId) {
      const previousMarker = markers.get(previousId);
      const previousBranch = branches.find((branch) => branch.id === previousId);
      if (previousMarker && previousBranch) {
        setBranchMarkerState(previousMarker, maps, previousBranch.status, "default");
      }
    }

    if (selectedBranchId) {
      const marker = markers.get(selectedBranchId);
      const branch = branches.find((candidate) => candidate.id === selectedBranchId);
      if (marker && branch) {
        setBranchMarkerState(marker, maps, branch.status, "selected");
        map.panTo({ lat: branch.latitude, lng: branch.longitude });
        if ((map.getZoom() ?? 0) < SELECTED_BRANCH_ZOOM) map.setZoom(SELECTED_BRANCH_ZOOM);
        if (!isDesktopRef.current) {
          // Décale la vue vers le haut pour que le marqueur reste visible
          // au-dessus de la fiche fixe mobile (§15).
          map.panBy(0, 90);
        }
      }
    }

    prevSelectedRef.current = selectedBranchId;
  }, [selectedBranchId, branches]);

  // Survol depuis la liste — met en évidence le marqueur, ne déplace jamais
  // la carte (seul le clic recentre — §8/§9).
  useEffect(() => {
    const maps = mapsApiRef.current;
    if (!maps) return;

    const previousHovered = prevHoveredRef.current;
    if (previousHovered === hoveredBranchId) return;

    const markers = markersRef.current;

    if (previousHovered && previousHovered !== selectedBranchId) {
      const marker = markers.get(previousHovered);
      const branch = branches.find((candidate) => candidate.id === previousHovered);
      if (marker && branch) setBranchMarkerState(marker, maps, branch.status, "default");
    }

    if (hoveredBranchId && hoveredBranchId !== selectedBranchId) {
      const marker = markers.get(hoveredBranchId);
      const branch = branches.find((candidate) => candidate.id === hoveredBranchId);
      if (marker && branch) setBranchMarkerState(marker, maps, branch.status, "hover");
    }

    prevHoveredRef.current = hoveredBranchId;
  }, [hoveredBranchId, selectedBranchId, branches]);

  const selectedBranch: BranchSummary | null = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId]
  );

  const handleClosePopup = useCallback(() => onSelectBranchRef.current(null), []);

  // Popup desktop : contenu React monté dans une vraie `InfoWindow` Google via
  // `createRoot` (§15) — jamais recréée, seulement re-rendue/ré-ouverte.
  useEffect(() => {
    if (!isDesktop) return;
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;

    if (!selectedBranch) {
      infoWindowRef.current?.close();
      return;
    }

    const marker = markersRef.current.get(selectedBranch.id);
    if (!marker) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow();
      maps.event.addListener(infoWindowRef.current, "closeclick", () => onSelectBranchRef.current(null));
    }
    if (!infoWindowContainerRef.current) {
      infoWindowContainerRef.current = document.createElement("div");
    }
    infoWindowContainerRef.current.dir = getDirection(locale);
    if (!infoWindowRootRef.current) {
      infoWindowRootRef.current = createRoot(infoWindowContainerRef.current);
    }

    infoWindowRootRef.current.render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <BranchPopup
          branch={selectedBranch}
          locale={locale}
          variant="panel"
          onClose={handleClosePopup}
          onViewDetails={handleViewDetails}
        />
      </NextIntlClientProvider>
    );
    infoWindowRef.current.setContent(infoWindowContainerRef.current);
    infoWindowRef.current.open({ map, anchor: marker });
  }, [selectedBranch, isDesktop, locale, messages, handleClosePopup, handleViewDetails]);

  // Nettoyage complet au démontage — jamais d'écouteur/racine React qui fuit
  // (§22). `markers` capturé ici (au montage) plutôt que relu via la ref au
  // démontage : c'est la même instance de `Map` pendant toute la vie du
  // composant (jamais réassignée, seulement mutée), mais capturer explique
  // l'intention et satisfait la règle `exhaustive-deps`.
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      infoWindowRootRef.current?.unmount();
      infoWindowRef.current?.close();
      const maps = mapsApiRef.current;
      if (maps) {
        for (const marker of markers.values()) {
          maps.event.clearInstanceListeners(marker);
        }
      }
      clusterRef.current?.destroy();
      userLocationMarkerRef.current?.setMap(null);
    };
  }, []);

  const isReady = loadState.status === "ready";

  return (
    <div className={cn("relative min-h-80 w-full", className)}>
      <div
        ref={containerRef}
        role="region"
        aria-label={t("regionLabel")}
        className={cn("size-full min-h-80 w-full overflow-hidden rounded-lg border", !isReady && "invisible")}
      />

      {loadState.status === "loading" && <MapLoadingState className="absolute inset-0" />}
      {loadState.status === "error" && (
        <MapErrorState
          reason={loadState.reason}
          onRetry={loadState.reason === "load_failed" ? handleRetry : undefined}
          className="absolute inset-0"
        />
      )}

      {/* Recentrage manuel (§6) — visible uniquement quand la position
          utilisateur est connue ; ramène la vue sur l'utilisateur sans
          attendre un nouveau changement de sélection. */}
      {isReady && userLocation && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => mapRef.current?.panTo(userLocation)}
          aria-label={t("recenter")}
          className="absolute bottom-4 end-4 z-10 shadow-md"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
        </Button>
      )}

      {isReady && !isDesktop && selectedBranch && (
        <div
          role="dialog"
          aria-label={selectedBranch.displayName}
          className="fixed inset-x-0 bottom-0 z-40"
        >
          <BranchPopup
            branch={selectedBranch}
            locale={locale}
            variant="sheet"
            onClose={handleClosePopup}
            onViewDetails={handleViewDetails}
          />
        </div>
      )}
    </div>
  );
}

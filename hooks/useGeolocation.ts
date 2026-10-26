"use client";

import { useCallback, useRef, useState } from "react";

import { mapGeolocationPositionError } from "@/lib/geolocation/errors";
import { INITIAL_GEOLOCATION_STATE, type GeolocationState } from "@/lib/geolocation/types";

/**
 * Options `getCurrentPosition` volontairement modestes (§19/§20 Phase 6) : un
 * Store Locator n'a pas besoin du GPS de précision maximale — `enableHighAccuracy`
 * coûte batterie et délai pour un gain inutile ici. `maximumAge` autorise le
 * navigateur à réutiliser une position récente (5 min) plutôt que de forcer un
 * nouveau relevé à chaque clic sur « près de moi ».
 */
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
};

export interface UseGeolocationResult {
  state: GeolocationState;
  /** Déclenche `getCurrentPosition` — n'est JAMAIS appelé automatiquement par ce
   * hook lui-même (aucun `useEffect` ici) : seul un geste utilisateur explicite
   * (clic sur « près de moi ») doit invoquer cette fonction (§1, impératif). */
  requestLocation: () => void;
}

/**
 * Géolocalisation navigateur réelle (§1) — état exposé sous forme de machine à
 * états simple (`GeolocationStatus`), position stockée UNIQUEMENT en mémoire
 * React le temps de la session, jamais persistée (§21), jamais envoyée à un
 * serveur ou à l'analytics par ce hook (§2 : la couche réseau ne voit jamais
 * ces coordonnées — c'est ce hook et lui seul qui les détient côté client).
 *
 * `getCurrentPosition` (pas `watchPosition`, §19) : une seule lecture par
 * demande, pas de suivi continu ni de re-rendus en boucle.
 */
export function useGeolocation(): UseGeolocationResult {
  const [state, setState] = useState<GeolocationState>(INITIAL_GEOLOCATION_STATE);
  // Évite deux requêtes concurrentes si l'utilisateur clique plusieurs fois
  // pendant que la première est encore en attente de réponse.
  const requestInFlightRef = useRef(false);

  const requestLocation = useCallback(() => {
    if (requestInFlightRef.current) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable", coordinates: null });
      return;
    }

    requestInFlightRef.current = true;
    setState({ status: "requesting", coordinates: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        requestInFlightRef.current = false;
        setState({
          status: "granted",
          coordinates: { lat: position.coords.latitude, lng: position.coords.longitude },
        });
      },
      (error) => {
        requestInFlightRef.current = false;
        setState({ status: mapGeolocationPositionError(error), coordinates: null });
      },
      GEOLOCATION_OPTIONS
    );
  }, []);

  return { state, requestLocation };
}

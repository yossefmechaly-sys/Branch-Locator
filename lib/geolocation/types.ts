import type { MapCoordinates } from "@/lib/maps/types";

/**
 * États du cycle de vie de la géolocalisation navigateur (§1 Phase 6).
 *
 * - `idle` : état initial, avant toute action utilisateur — AUCUNE requête de
 *   permission n'est jamais déclenchée automatiquement (§1, impératif).
 * - `requesting` : `getCurrentPosition` en cours, en attente de la réponse
 *   navigateur/utilisateur.
 * - `granted` : position obtenue avec succès.
 * - `denied` : l'utilisateur a refusé la permission (`GeolocationPositionError.code === 1`).
 * - `unavailable` : position indisponible (`code === 2`), ou API absente du
 *   navigateur (détecté avant même l'appel).
 * - `timeout` : délai dépassé (`code === 3`).
 * - `error` : erreur générique non classifiée (filet de sécurité).
 */
export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

/**
 * État complet exposé par `useGeolocation` — les coordonnées ne sont peuplées
 * que lorsque `status === "granted"`, sinon toujours `null` (§2 : jamais de
 * position résiduelle affichée pour un état d'échec).
 */
export interface GeolocationState {
  status: GeolocationStatus;
  coordinates: MapCoordinates | null;
}

export const INITIAL_GEOLOCATION_STATE: GeolocationState = {
  status: "idle",
  coordinates: null,
};

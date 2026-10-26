import type { GeolocationStatus } from "./types";

/**
 * Traduit un `GeolocationPositionError` natif (codes numériques opaques de la
 * spec W3C — 1/2/3) vers l'un des statuts d'échec de `GeolocationStatus`, pour
 * que le reste de l'application ne manipule jamais de code numérique brut
 * (§8 : chaque état d'échec a un message traduit dédié).
 */
export function mapGeolocationPositionError(
  error: Pick<GeolocationPositionError, "code">
): Extract<GeolocationStatus, "denied" | "unavailable" | "timeout" | "error"> {
  switch (error.code) {
    case 1 /* PERMISSION_DENIED */:
      return "denied";
    case 2 /* POSITION_UNAVAILABLE */:
      return "unavailable";
    case 3 /* TIMEOUT */:
      return "timeout";
    default:
      return "error";
  }
}

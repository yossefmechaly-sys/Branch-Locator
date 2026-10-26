/**
 * Chargement du script Google Maps JS — le SEUL endroit de l'application qui
 * injecte `<script src="https://maps.googleapis.com/...">` (§3/§4).
 *
 * Écrit à la main plutôt que via une dépendance (`@googlemaps/js-api-loader`) :
 * le besoin réel — vérifier si le SDK est déjà chargé, sinon injecter le script
 * une seule fois et mettre la promesse en cache — tient en quelques lignes, et
 * garder la main dessus simplifie le test (voir plus bas) sans dépendance
 * supplémentaire (§22 : éviter le rechargement du script, garder les choses
 * simples).
 *
 * La clé est lue UNIQUEMENT depuis `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (§3) —
 * jamais codée en dur. C'est la seule variable Google Maps exposée au
 * navigateur ; `GOOGLE_GEOCODING_API_KEY` (`.env.example`, Phase 9) reste
 * strictement côté serveur.
 */

export type GoogleMapsLoadErrorReason = "missing_api_key" | "script_load_failed";

export class GoogleMapsLoadError extends Error {
  reason: GoogleMapsLoadErrorReason;

  constructor(reason: GoogleMapsLoadErrorReason, message: string) {
    super(message);
    this.name = "GoogleMapsLoadError";
    this.reason = reason;
  }
}

const SCRIPT_ELEMENT_ID = "maayan2000-google-maps-script";
const CALLBACK_NAME = "__maayan2000GoogleMapsLoaded";

declare global {
  interface Window {
    [key: string]: unknown;
  }
}

/** Promesse partagée par tous les appelants — le script n'est injecté qu'une
 * seule fois pour toute la durée de vie de la page (§22). */
let loadPromise: Promise<typeof google> | null = null;

export function getGoogleMapsApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return key && key.trim().length > 0 ? key : null;
}

/**
 * Charge le SDK Google Maps (bibliothèques `marker`) et résout avec l'objet
 * `google` global. Idempotent : les appels suivants renvoient la même
 * promesse déjà en cache, jamais un second `<script>`.
 *
 * Rejette avec `GoogleMapsLoadError` — jamais une exception qui remonterait
 * jusqu'à faire planter le Store Locator (§18) : c'est à l'appelant
 * (`BranchMap`) d'attraper cette erreur et d'afficher `MapErrorState`.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (loadPromise) return loadPromise;

  // Déjà chargé par un moyen quelconque (autre montage, script externe) : on
  // ne réinjecte rien.
  if (typeof window !== "undefined" && window.google?.maps) {
    loadPromise = Promise.resolve(window.google);
    return loadPromise;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(
      new GoogleMapsLoadError(
        "missing_api_key",
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY n'est pas définie."
      )
    );
  }

  loadPromise = new Promise<typeof google>((resolve, reject) => {
    window[CALLBACK_NAME] = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new GoogleMapsLoadError("script_load_failed", "Le SDK Google Maps ne s'est pas initialisé."));
      }
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ELEMENT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=marker&loading=async&callback=${CALLBACK_NAME}`;
    script.onerror = () => {
      reject(
        new GoogleMapsLoadError(
          "script_load_failed",
          "Échec du chargement du script Google Maps (réseau, quota ou clé invalide)."
        )
      );
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // Un échec ne doit jamais rester en cache : un nouveau montage de
    // `BranchMap` (ex. bouton « Réessayer ») doit pouvoir retenter le
    // chargement plutôt que de rejeter indéfiniment la même erreur.
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

/** Exposé pour les tests uniquement (réinitialise le cache module). */
export function __resetGoogleMapsLoaderForTests(): void {
  loadPromise = null;
}

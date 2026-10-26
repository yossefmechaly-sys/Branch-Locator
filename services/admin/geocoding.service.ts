/**
 * Géocodage serveur (Phase 9, §9) — clé `GOOGLE_GEOCODING_API_KEY` lue
 * UNIQUEMENT ici, jamais exposée au navigateur (ce fichier n'est importé que
 * par une Server Action, jamais par un composant client). Distincte de
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Phase 5, restreinte à "Maps JavaScript
 * API" et volontairement publique) — deux clés Google Cloud séparées, deux
 * usages séparés (§9, impératif).
 *
 * Appelée UNIQUEMENT sur action explicite (« Rechercher l'adresse » dans
 * `BranchForm`), jamais à chaque frappe (§9) — cette fonction elle-même ne
 * fait aucune supposition de fréquence d'appel, c'est l'appelant (Server
 * Action déclenchée par un clic) qui garantit cette contrainte.
 */
export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingError";
  }
}

interface GoogleGeocodeResponse {
  status: string;
  results: {
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }[];
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    throw new GeocodingError("Adresse vide");
  }

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    throw new GeocodingError(
      "GOOGLE_GEOCODING_API_KEY n'est pas configurée sur le serveur — géocodage indisponible"
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", trimmed);
  url.searchParams.set("region", "il"); // biais Israël (§9 : contexte du projet)
  url.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new GeocodingError("Échec réseau lors de l'appel à Google Geocoding");
  }

  if (!response.ok) {
    throw new GeocodingError(`Erreur Google Geocoding (HTTP ${response.status})`);
  }

  const data = (await response.json()) as GoogleGeocodeResponse;
  const first = data.results?.[0];
  if (data.status !== "OK" || !first) {
    throw new GeocodingError(`Adresse introuvable (statut Google : ${data.status})`);
  }

  return {
    latitude: first.geometry.location.lat,
    longitude: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
  };
}

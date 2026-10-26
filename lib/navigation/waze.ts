import type { NavigationTarget } from "./types";

/**
 * URL Waze pour naviguer vers un magasin (§9 Phase 6). Priorité aux
 * coordonnées GPS — c'est le format le plus fiable, indépendant de tout
 * géocodage d'adresse côté Waze. Un `wazeUrlOverride` saisi en admin (quand le
 * modèle le fournit — `BranchDetail`, Phase 8) est prioritaire quand présent,
 * pour couvrir les cas où l'équipe magasin préfère un lien Waze spécifique.
 *
 * Aucun appel réseau/API ici : simple construction d'URL (§28 — pas de
 * Routes/Distance Matrix).
 */
export function buildWazeUrl(target: NavigationTarget): string {
  if (target.wazeUrlOverride) return target.wazeUrlOverride;
  return `https://waze.com/ul?ll=${target.latitude},${target.longitude}&navigate=yes`;
}

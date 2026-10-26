/**
 * Forme minimale nécessaire pour construire une URL de navigation externe —
 * délibérément PLUS PETITE que `BranchSummary` (§23 Phase 6 : les helpers ne
 * doivent dépendre que de ce dont ils ont réellement besoin, pas de tout le
 * type magasin). `BranchSummary` n'a pas encore `wazeUrlOverride` (réservé à
 * `BranchDetail`, Phase 8) — le champ reste optionnel ici pour que ce module
 * fonctionne dès maintenant avec `BranchSummary` ET plus tard, sans
 * modification, avec `BranchDetail`.
 */
export interface NavigationTarget {
  latitude: number;
  longitude: number;
  address: string;
  /** URL Waze saisie manuellement en admin, prioritaire sur les coordonnées
   * GPS si présente (§9). `undefined`/`null` = pas d'override, utiliser les
   * coordonnées. */
  wazeUrlOverride?: string | null;
}

import { normalizeSearchText } from "./normalize";

/**
 * Algorithme de correspondance générique, indépendant du domaine (magasins,
 * villes…) et de Prisma — testable en isolation avec de simples fixtures.
 *
 * La couche `services/branch.service.ts` est responsable de construire
 * `searchTerms` à partir des traductions ET des `SearchAlias` dans les CINQ
 * langues (pas seulement la langue d'affichage courante), pour que
 * "ירושלים" / "Jerusalem" / "Иерусалим" / "Jérusalem" / "Jerusalén" retournent
 * tous les mêmes magasins quelle que soit la langue de l'interface (cahier des
 * charges §6).
 */
export interface SearchableRecord {
  searchTerms: readonly string[];
}

/**
 * Un enregistrement correspond si l'un de ses `searchTerms` (normalisé) CONTIENT
 * la requête normalisée — permet une recherche partielle ("Jer" → "Jerusalem"),
 * y compris au milieu d'un terme composé ("בר-כוכבא" → "כוכבא").
 */
export function matchesSearchQuery(searchTerms: readonly string[], rawQuery: string): boolean {
  const query = normalizeSearchText(rawQuery);
  if (!query) return true;
  return searchTerms.some((term) => normalizeSearchText(term).includes(query));
}

export function filterBySearchQuery<T extends SearchableRecord>(
  records: readonly T[],
  rawQuery: string
): T[] {
  const query = normalizeSearchText(rawQuery);
  if (!query) return [...records];
  return records.filter((record) => matchesSearchQuery(record.searchTerms, rawQuery));
}

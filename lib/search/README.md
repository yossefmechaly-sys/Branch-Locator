# lib/search

Recherche multilingue — algorithme pur, indépendant de Prisma.

- `normalizeSearchText()` : insensible à la casse et aux diacritiques latins.
- `filterBySearchQuery()` / `matchesSearchQuery()` : correspondance par
  sous-chaîne sur un ensemble de `searchTerms` déjà rassemblés par l'appelant
  (`services/branch.service.ts` y place les traductions de nom de magasin/ville
  dans les CINQ langues + les `SearchAlias`, pas seulement la langue affichée —
  §6 du cahier des charges).

À cette échelle (12 magasins DEMO), le filtrage se fait en mémoire côté serveur.
Une tolérance aux fautes de frappe via `pg_trgm` (déjà activé en Phase 3) pourra
remplacer cette étape au niveau SQL si le volume de données réelles le justifie —
prévu en Phase 9 avec l'import CSV/Excel des vrais magasins.

Testé unitairement dans `tests/unit/search.test.ts`.

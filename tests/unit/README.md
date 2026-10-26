# tests/unit

Vitest (`npm test`). Introduit dès la Phase 4 (à la demande explicite de
l'utilisateur — le plan initial de Phase 1 prévoyait la Phase 11) pour les
modules purs qui existent déjà :

- `opening-hours-status.test.ts` — `getBranchStatus()` : horaires hebdomadaires,
  seuils opening/closing soon, coupure méridienne (double créneau), horaires
  spéciaux (jour férié ouvert à horaires réduits / fermé). Toutes les dates de
  référence sont calculées explicitement dans le fuseau Asia/Jerusalem.
- `search.test.ts` — `normalizeSearchText()` / `matchesSearchQuery()` : le
  scénario exact du cahier des charges (§6) — ירושלים / Jerusalem / Иерусалим /
  Jérusalem / Jerusalén retournent le même magasin quelle que soit la langue de
  la requête.
- `branch-filters.test.ts` — `applyBranchFilters()` : ville, service, « ouvert
  maintenant », combinaisons.

`calculateDistance` / `getNextOpeningTime` : ajoutés quand ces fonctions
existeront (Phases 6/7).

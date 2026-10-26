# lib/analytics

Pipeline analytics interne (Phase 10). `track()` (côté client) envoie chaque
événement à `POST /api/analytics/event` via `navigator.sendBeacon()` (repli
`fetch(..., { keepalive: true })`), sans jamais attendre de réponse ni casser
l'appelant (§7).

- `events.ts` — catalogue complet des événements (`AnalyticsEvent`), aucune
  coordonnée ni donnée personnelle possible par construction.
- `search-classification.ts` — classifie une recherche (ville/magasin/
  autre/aucun résultat) SANS jamais transmettre le texte saisi (§4).
- `normalize.ts` — traduit un événement validé en ligne prête à écrire,
  indépendante du fournisseur.
- `session.ts` — identifiant de session anonyme, cookie `httpOnly` 30 minutes
  glissantes, aucun fingerprinting (§5).
- `rate-limit.ts` — limite de débit en mémoire, best-effort (§7/§37).
- `providers/` — abstraction fournisseur (§1) : PostgreSQL est le seul
  fournisseur implémenté cette phase ; Google Analytics/Matomo/Mixpanel/
  Segment pourront être ajoutés à `providers/index.ts` sans toucher au reste.

Lecture/agrégation (tableau de bord `/admin/analytics`) : voir
`services/admin/analytics.service.ts` et `lib/analytics/queries.ts` —
volontairement séparés de ce dossier, qui ne s'occupe que de l'ÉCRITURE.

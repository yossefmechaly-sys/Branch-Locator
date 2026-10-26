# services

Couche « données + orchestration », seule autorisée à parler à Prisma. Aucun
composant UI n'importe `lib/prisma` ni `@prisma/client` directement.

- `branch.repository.ts` — interface `BranchRepository` + types `Raw*` (formes
  Prisma-agnostiques, pour que la logique métier type-check indépendamment de la
  génération du client Prisma).
- `branch.repository.prisma.ts` — implémentation Prisma (production).
- `locale-projection.ts` — résolution d'une traduction avec repli vers l'hébreu.
- `branch.service.ts` — `getBranchLocatorData()` : orchestre repository → statut
  (`lib/opening-hours`) → recherche (`lib/search`) → filtres (`lib/filters`) →
  projection localisée. Consommé par `app/api/branches/route.ts` et par
  `app/[locale]/branches/page.tsx` (rendu serveur initial).

`city.service.ts` / `service.service.ts` / `promotion.service.ts` /
`analytics.service.ts` dédiés arriveront quand le back-office (Phase 9) en aura
besoin — pour l'instant, `branch.repository.prisma.ts` charge villes et services
comme relations imbriquées d'un seul aller-retour (12 magasins DEMO : pas besoin
de requêtes séparées à cette échelle).

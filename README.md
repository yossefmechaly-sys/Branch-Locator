# Maayan 2000 — Smart Branch Locator

Store Locator professionnel, multilingue (he/en/ru/fr/es) et mobile-first pour la
chaîne Maayan 2000. Voir le document d'architecture (Phase 1) pour le détail complet
du schéma de données, des routes, des endpoints API et des stratégies techniques.

> **Statut** : Phase 5 — Store Locator fonctionnel (recherche multilingue, filtres,
> statut ouvert/fermé, responsive) avec carte Google Maps réelle (marqueurs,
> clustering, popup, synchronisation liste ↔ carte). La géolocalisation utilisateur
> réelle et la navigation Waze/Google Maps/Apple Maps arrivent en Phase 6 ; le
> back-office en Phase 9.

## Base de données

Voir `prisma/schema.prisma` (Phase 3). `npx prisma generate` puis
`npx prisma migrate dev` (ou `db seed` seul) préparent une base locale avec 12
magasins DEMO multilingues — voir le résumé de Phase 3 pour le détail complet
(version Prisma épinglée, identifiants admin DEMO, etc.).

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript strict
- Tailwind CSS v4
- shadcn/ui (primitives dans `components/ui/`)
- next-intl (i18n, cinq langues)

## Démarrage

```bash
npm install
npm run dev
```

L'application redirige automatiquement `/` vers la langue détectée
(`/he`, `/en`, `/ru`, `/fr` ou `/es`), puis vers `/[locale]/branches`.

## Internationalisation

- Langues : hébreu (`he`, RTL, langue par défaut), anglais, russe, français, espagnol.
- URLs toujours préfixées par la locale (`localePrefix: "always"`), y compris pour
  l'hébreu.
- Textes d'interface : `messages/{locale}.json` — jamais codés en dur dans les
  composants.
- Résolution de la locale (`proxy.ts`, convention Next.js 16 — anciennement
  `middleware.ts`) : URL > cookie `NEXT_LOCALE` > `Accept-Language` > hébreu par défaut.
- `LanguageSwitcher` (`components/i18n/LanguageSwitcher.tsx`) change la langue en
  conservant la page courante.

## RTL / LTR

`app/[locale]/layout.tsx` pose `lang`/`dir` dynamiquement sur `<html>`. Toute nouvelle
classe Tailwind doit utiliser les propriétés logiques (`ms-`/`me-`/`ps-`/`pe-`/
`start-`/`end-`) plutôt que physiques (`ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`) — une
règle ESLint (`no-restricted-syntax`) avertit en cas d'oubli sur les classes statiques.

## Store Locator (Phase 4)

- `services/branch.service.ts` — seul point d'entrée pour les données de
  magasin (repository → statut horaire → recherche → filtres → localisation).
  Aucun composant n'accède à Prisma directement.
- `app/api/branches` — API publique consommée par le client (`hooks/useBranches`).
- `lib/opening-hours`, `lib/search`, `lib/filters` — modules purs et testés
  (`npm test`), indépendants de Prisma et de React.
- `components/branches/BranchLocator` — orchestrateur UI ; desktop = liste 40 %
  / carte 60 %, mobile = liste prioritaire avec onglet Carte. `components/maps/BranchMap`
  implémente l'interface `BranchMapViewProps` (`types/map.ts`) définie dès la
  Phase 4 — la carte a été branchée sans réécrire `BranchList`/`BranchCard`.

Voir les fichiers `README.md` présents dans chaque dossier (`lib/*`, `services/`,
`hooks/`, `components/branches`, `components/maps`, `components/admin`, `tests/*`,
`prisma/`) pour le détail de leur contenu.

## Cartographie (Phase 5)

Carte interactive Google Maps réelle, branchée dans le Store Locator sans jamais
faire dépendre `BranchList`/`BranchCard`/`BranchLocator` des types `google.maps.*` :

- `lib/maps/types.ts`, `lib/maps/coordinates.ts` — types agnostiques
  (`MapCoordinates`, `MapBounds`) et calcul de bounds/zoom, purs, sans Google.
- `lib/maps/icon.ts` — icônes de marqueur (identité Maayan 2000, disques colorés
  par statut), également agnostiques (`MarkerIconSpec`).
- `lib/maps/mount.ts` — décide si/quand monter la carte (`shouldMountGoogleMap`).
- `lib/maps/providers/google/` — SEUL endroit qui connaît l'API Google réelle :
  `loader.ts` (chargement du script), `icon.ts` (conversion vers `google.maps.Icon`).
  Migrer vers un autre fournisseur (Mapbox, MapLibre…) demanderait d'ajouter
  `providers/<fournisseur>/` avec la même forme, sans toucher au reste.
- `components/maps/BranchMap.tsx` — orchestrateur React ; `BranchMarker.ts` /
  `BranchCluster.ts` — création/mise à jour impérative des marqueurs et du
  clustering (`@googlemaps/markerclusterer`) ; `BranchPopup`, `MapLoadingState`,
  `MapErrorState` — composants présentationnels. Détail complet dans
  `components/maps/README.md`.

**Résilience** : clé API absente, échec réseau/quota, ou toute erreur du SDK
Google → `MapErrorState` (message traduit, cinq langues) ; la liste des magasins
reste pleinement utilisable dans tous les cas (recherche, filtres, WhatsApp,
appel — rien ne dépend de la carte).

**Sécurité de la clé Google Cloud** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` est
inévitablement visible dans le code livré au navigateur (préfixe `NEXT_PUBLIC_`) :
ne jamais utiliser une clé Google Cloud non restreinte en production. Dans
Google Cloud Console (API et services > Identifiants > votre clé) :

1. **Restriction d'application** : « Referrers HTTP (sites web) » — lister
   précisément les domaines autorisés (ex. `https://votre-domaine.com/*`), jamais
   un joker ouvert.
2. **Restriction d'API** : limiter la clé à « Maps JavaScript API » uniquement.
3. Garder cette clé strictement distincte de `GOOGLE_GEOCODING_API_KEY` (Phase 9,
   utilisée uniquement côté serveur, jamais exposée au client).

Voir `.env.example` pour le rappel de ces étapes au bon endroit.

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner les valeurs au fur et à mesure
des phases (base de données en Phase 3, Google Maps en Phase 5, authentification en
Phase 9). `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` est optionnelle en développement : son
absence n'empêche pas de travailler sur le reste du Store Locator (`MapErrorState`
l'indique proprement, voir « Cartographie » ci-dessus).

## Qualité

```bash
npm run lint       # ESLint (inclut la règle RTL/LTR)
npx tsc --noEmit   # Vérification TypeScript stricte
npm test           # Vitest — modules purs (horaires, recherche, filtres)
npm run build      # Build de production
```

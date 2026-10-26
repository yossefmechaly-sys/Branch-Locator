# components/maps

`BranchMap` implémente `BranchMapViewProps` (`types/map.ts`) — jusqu'à la
Phase 5, `MapPlaceholder` implémentait la même interface le temps que la vraie
carte n'existait pas encore ; il a été retiré une fois `BranchMap` branché
dans `BranchLocator`, sans toucher au reste du câblage liste ↔ carte (§1/§9
du cahier des charges Phase 5).

`BranchMap.tsx` — orchestrateur React (chargement du SDK, création de la
carte, réconciliation des marqueurs, sélection/survol, popup desktop/mobile).
Toute l'API `google.maps.*` reste confinée à ce fichier et aux modules
suivants, jamais exposée à `BranchLocator`/`BranchList`/`BranchCard` (§21) :

- `BranchMarker.ts` — crée/maintient un `google.maps.Marker` par magasin
  (états défaut/survol/sélectionné, jamais recréé — seule l'icône change).
- `BranchCluster.ts` — regroupe les marqueurs quand ils se chevauchent
  (`@googlemaps/markerclusterer`), avec repli silencieux sur des marqueurs
  individuels si le clustering échoue à s'initialiser (§18).

Composants présentationnels, sans dépendance à `google.maps.*` :

- `BranchPopup.tsx` — contenu compact d'un magasin sélectionné ; monté soit
  dans une `InfoWindow` Google (desktop, via `createRoot`), soit directement
  en React comme fiche fixe bas d'écran (mobile) — §10/§15.
- `MapLoadingState.tsx` — pendant le chargement différé du SDK (§4).
- `MapErrorState.tsx` — clé API absente ou échec réseau/quota/script (§18/§19).

Pas de `MapControls.tsx` dédié (facultatif au cahier des charges, §2) : les
contrôles natifs de Google (zoom, ...) suffisent, `mapTypeControl`/
`streetViewControl`/`fullscreenControl` sont simplement désactivés dans
`BranchMap` pour rester sobre — ajouter un contrôle personnalisé plus tard
n'impacterait que ce dossier.

Voir aussi `lib/maps/` (types agnostiques, calcul de bounds, décision de
montage) et `lib/maps/providers/google/` (chargement du script, conversion
d'icônes — le seul endroit qui connaît les types `google.maps.*` bruts).

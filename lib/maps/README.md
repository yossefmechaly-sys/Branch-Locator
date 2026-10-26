# lib/maps

Abstraction cartographique (Phase 5).

- `types.ts` — `MapCoordinates`, `MapBounds`, limites de zoom, centre par
  défaut. Les composants métier (`BranchLocator`, `BranchList`, `BranchCard`)
  et `components/maps/*` ne manipulent que ces types, jamais `google.maps.*`
  directement (§21).
- `coordinates.ts` — `computeBounds()`, `clampZoom()` : logique pure, testée
  sans charger le SDK Google Maps.
- `providers/google/` — tout ce qui touche réellement à l'API Google Maps
  (chargement du script, icônes). Migrer vers un autre fournisseur (Mapbox,
  MapLibre…) reviendrait à ajouter `providers/<fournisseur>/` et à échanger
  l'import utilisé par `components/maps/BranchMap.tsx`, sans toucher à
  `BranchLocator`.

**Écart avec la note de Phase 1** : l'architecture y envisageait une interface
`MapProvider` (classe commune implémentée par chaque fournisseur). Un seul
fournisseur existe à ce jour et aucun second n'est en construction — définir
cette interface maintenant serait de l'abstraction spéculative. La séparation
utile (types agnostiques + dossier `providers/` dédié) est en place ; le jour
où un second fournisseur est réellement nécessaire, en extraire l'interface
commune à partir de deux implémentations réelles sera plus fiable que de
deviner sa forme aujourd'hui.

# lib/navigation

Construction d'URLs de navigation externes vers Waze / Google Maps / Apple Maps
(`buildWazeUrl`, `buildGoogleMapsUrl`, `buildAppleMapsUrl`) + détection iOS/macOS
non critique (`isAppleDevice`). Modules purs, testables unitairement — aucun
appel réseau/API cartographique supplémentaire (Routes, Distance Matrix,
Places…), uniquement des chaînes d'URL publiques documentées. Les composants
UI (`components/branches/NavigationMenu.tsx`, `BranchCard`) n'assemblent
jamais eux-mêmes ces URLs — ils appellent uniquement ces helpers. Ajouté en
Phase 6.

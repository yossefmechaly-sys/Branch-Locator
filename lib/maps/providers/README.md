# lib/maps/providers

Implémentations concrètes liées à un fournisseur cartographique précis.

- `google/loader.ts` — chargement (unique, mis en cache) du script Google Maps
  JS. Lit `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, jamais de clé en dur.
- `google/icon.ts` — convertit un `MarkerIconSpec` agnostique
  (`lib/maps/icon.ts`) en `google.maps.Icon` réel.

Un futur fournisseur (Mapbox, MapLibre…) ajouterait `providers/<fournisseur>/`
avec la même forme, sans toucher à `components/maps/BranchMap.tsx` au-delà de
l'import du loader/adaptateur utilisé.

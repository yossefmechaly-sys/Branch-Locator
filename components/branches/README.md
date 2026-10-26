# components/branches

Store Locator — Phase 4. Décomposition stricte (§7) : ces composants ne
calculent rien eux-mêmes, ils affichent des données déjà résolues par
`services/branch.service.ts` (statut, filtres, recherche) et remontent des
callbacks à leur parent.

- `BranchLocator` — orchestrateur : état de l'UI (recherche/filtres/sélection),
  layout responsive, câblage `useBranches`. Aucune logique métier.
- `BranchSearch` — champ de recherche + bouton « près de moi » (câblé, désactivé
  jusqu'à la géolocalisation réelle de la Phase 6).
- `BranchFilters` — ville / service / « ouvert maintenant ».
- `BranchList` — choisit entre les états loading / error / empty / success.
- `BranchListSkeleton`, `BranchListEmptyState`, `BranchListErrorState` — un état
  chacun.
- `BranchCard` — une fiche magasin : statut, horaires du jour, distance,
  services essentiels (+ détail dépliable), WhatsApp, appel, navigation (câblée,
  désactivée jusqu'à Waze/Google Maps réels des Phases 5/6).
- `BranchStatus` — badge ouvert/fermé + horaires du jour (présentationnel pur).
- `DistanceBadge` — masqué tant que `distanceMeters` est `null` (Phase 6).
- `ServiceIcon` — résolution `Service.icon` → icône Lucide.

`OpeningHours`, `BranchServices`, `BranchPromotions`, `FavoriteBranch` (liste
plus longue envisagée en Phase 1) : ajoutés plus tard si le besoin se confirme —
`BranchCard` couvre déjà horaires et services essentiels pour cette phase.

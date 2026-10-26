import type { AppLocale } from "./i18n";
import type { BranchSummary } from "./branch";
import type { MapCoordinates } from "@/lib/maps/types";

/**
 * Interface implémentée par `components/maps/BranchMap` (Google Maps réel,
 * Phase 5) — et par `MapPlaceholder`, son substitut Phase 4, tant qu'il a
 * existé.
 *
 * Le but explicite de ce type était de permettre à `BranchLocator` de
 * brancher la liste sur la carte — sélection croisée, survol, callbacks de
 * navigation — sans réécrire son câblage quand `MapPlaceholder` serait
 * remplacé par la vraie carte (§1 de la Phase 5) : ce remplacement a
 * effectivement eu lieu sans toucher à `BranchList`/`BranchCard`, exactement
 * comme prévu.
 *
 * Extension Phase 5 (§1 : « ne modifier que si vraiment nécessaire ») — trois
 * champs ajoutés, tous exploités par `BranchMap` uniquement :
 * - `locale` : nécessaire au formatage localisé (`DistanceBadge`, nombre sur
 *   les clusters) — absent de l'interface Phase 4 car `MapPlaceholder` ne
 *   formatait rien lui-même.
 * - `onViewDetails` : le bouton « détails » de `BranchPopup` (§9).
 * - `userLocation` : type agnostique préparé pour la Phase 6 (§16/§21) — nom
 *   volontairement présent dès maintenant, jamais rempli ni lu cette phase.
 */
export interface BranchMapViewProps {
  branches: BranchSummary[];
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string | null) => void;
  /** Survol depuis la liste (Phase 5 : mise en évidence du marqueur correspondant). */
  hoveredBranchId?: string | null;
  onHoverBranch?: (branchId: string | null) => void;
  locale: AppLocale;
  /** Bouton « détails » de `BranchPopup` — signale au parent de mettre en avant
   * la fiche correspondante dans la liste (§9). */
  onViewDetails?: (branchId: string) => void;
  /** Préparé pour la Phase 6 (géolocalisation réelle) — jamais fourni ni utilisé
   * cette phase (§16). */
  userLocation?: MapCoordinates | null;
  className?: string;
}

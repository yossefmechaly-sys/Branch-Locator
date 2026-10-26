import type { BranchDetail } from "@/types/branch";

import { BranchActions } from "./BranchActions";

export interface BranchStickyActionBarProps {
  branch: BranchDetail;
}

/**
 * Barre d'actions sticky mobile (Phase 8, §7 : « prévoir éventuellement une
 * barre d'actions sticky en bas »). Sur une fiche magasin longue (galerie,
 * horaires complets, promotions, carte...), les trois actions principales du
 * hero (Navigation/Appeler/WhatsApp) sortent vite de l'écran en défilant —
 * cette barre les garde accessibles en permanence sur mobile, exactement
 * comme un panier d'achat resterait accessible sur une fiche produit.
 *
 * Volontairement PAS une seconde implémentation : c'est le même
 * `BranchActions` que le hero, simplement remonté une seconde fois avec un
 * habillage de positionnement différent (§16, ne pas dupliquer la logique de
 * navigation/analytics — seul le style change). `md:hidden` : desktop garde
 * uniquement les actions du hero, toujours visibles dans la disposition large
 * (§32 : priorités mobiles, pas desktop).
 *
 * `env(safe-area-inset-bottom)` évite que la barre ne soit masquée par
 * l'encoche/la barre de gestes des téléphones récents.
 */
export function BranchStickyActionBar({ branch }: BranchStickyActionBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <BranchActions branch={branch} className="flex flex-wrap justify-center gap-2" />
    </div>
  );
}

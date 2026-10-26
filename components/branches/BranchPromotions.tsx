"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/types/i18n";
import type { LocalizedPromotion } from "@/types/promotion";

import { PromotionCard } from "./PromotionCard";

/** Nombre de promotions affichées avant repli derrière "Voir toutes les
 * promotions" (Phase 9, §12) — même ordre de grandeur que
 * `ESSENTIAL_SERVICES_LIMIT` (`BranchCard.tsx`), pas de raison technique
 * précise, juste éviter qu'une fiche magasin très promotionnée n'allonge
 * excessivement la page avant même la section horaires/carte. */
const INITIAL_VISIBLE_LIMIT = 4;

export interface BranchPromotionsProps {
  promotions: LocalizedPromotion[];
  /** Magasin dont ces promotions proviennent — transmis tel quel à
   * `PromotionCard` pour le marquage analytics (§18), jamais recalculé ici. */
  branchId: string;
  locale: AppLocale;
}

/**
 * Section « Promotions dans ce magasin » (Phase 8, §11/§12 ; Phase 9, §12) —
 * Client Component : la troncature "Voir toutes les promotions" (§12) a
 * besoin d'un état local (`expanded`), c'est la SEULE raison de ce
 * changement — le rendu de chaque carte reste délégué à `PromotionCard`
 * (Server Component), aucune logique de filtrage/tri n'est dupliquée ici :
 * `promotions` arrive déjà filtrée (active, applicable à ce magasin) ET déjà
 * triée par priorité (locale > globale > `priority`, §8) par
 * `getBranchDetailBySlug()` — ce composant ne refait AUCUN filtrage ni tri.
 *
 * Rendu conditionnel : la section entière est omise si la liste est vide
 * (aucune promotion active en ce moment) — pas de titre de section vide, pas
 * de message "aucune promotion" qui ajouterait du bruit à une page dont ce
 * n'est pas le contenu principal (§37 : gérer l'absence sans casser la page).
 */
export function BranchPromotions({ promotions, branchId, locale }: BranchPromotionsProps) {
  const t = useTranslations("branchDetail.promotions");
  const [expanded, setExpanded] = useState(false);

  if (promotions.length === 0) return null;

  const visiblePromotions = expanded ? promotions : promotions.slice(0, INITIAL_VISIBLE_LIMIT);
  const hiddenCount = promotions.length - visiblePromotions.length;

  return (
    <section aria-labelledby="branch-promotions-heading" className="flex flex-col gap-3">
      <h2 id="branch-promotions-heading" className="text-lg font-semibold tracking-tight">
        {t("sectionTitle")}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visiblePromotions.map((promotion) => (
          <PromotionCard key={promotion.id} promotion={promotion} branchId={branchId} locale={locale} />
        ))}
      </div>

      {hiddenCount > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setExpanded(true)}
        >
          {t("showAll", { count: promotions.length })}
        </Button>
      )}
    </section>
  );
}

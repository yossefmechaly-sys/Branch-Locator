import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { computeDiscount } from "@/lib/pricing/discount";
import { decimalStringToCents, formatMoney } from "@/lib/pricing/money";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/types/i18n";
import type { PromotionCurrency, PromotionUnit } from "@/types/promotion";

export interface PromotionPriceProps {
  /** Chaîne décimale ("29.90") — JAMAIS un `number`, voir `lib/pricing/money.ts`. */
  price: string;
  originalPrice: string | null;
  currency: PromotionCurrency;
  unit: PromotionUnit;
  locale: AppLocale;
  /** "lg" (défaut) : `PromotionCard`, prix visuellement dominant (§11). "sm" :
   * aperçu compact `BranchCard`/`BranchPopup` (§13/§14), même logique, taille
   * réduite. */
  size?: "lg" | "sm";
  className?: string;
}

/**
 * Bloc de prix structuré (Phase 9, §2/§3/§4/§5/§6/§11) — LE seul endroit qui
 * convertit un prix en affichage : `PromotionCard` (fiche magasin) et
 * l'aperçu compact `BranchCard`/`BranchPopup` (Store Locator) passent tous
 * les deux par ce composant, jamais un calcul de réduction ni un formatage
 * monétaire dupliqué ailleurs.
 *
 * Reçoit des chaînes décimales (jamais un `number`) et ne convertit en entier
 * de centimes qu'à l'intérieur, via `lib/pricing/money.ts#decimalStringToCents()`
 * — aucune arithmétique flottante sur un montant financier (§2).
 */
export function PromotionPrice({
  price,
  originalPrice,
  currency,
  unit,
  locale,
  size = "lg",
  className,
}: PromotionPriceProps) {
  const t = useTranslations("branchDetail.promotions");

  const priceCents = decimalStringToCents(price);
  const originalPriceCents = originalPrice ? decimalStringToCents(originalPrice) : null;
  const discount = computeDiscount(priceCents, originalPriceCents);

  const isLarge = size === "lg";

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-1.5 gap-y-1", className)}>
      <span
        className={cn(
          "font-bold tabular-nums text-primary",
          isLarge ? "text-2xl leading-tight" : "text-base leading-tight"
        )}
      >
        {formatMoney(priceCents, currency, locale)}
      </span>
      <span className={cn("text-muted-foreground", isLarge ? "text-sm" : "text-xs")}>
        {t(`units.${unit}`)}
      </span>

      {discount && originalPriceCents !== null && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through tabular-nums",
              isLarge ? "text-sm" : "text-xs"
            )}
          >
            {formatMoney(originalPriceCents, currency, locale)}
          </span>
          <Badge variant="destructive" className={isLarge ? undefined : "px-1 py-0 text-[10px]"}>
            {t("discountBadge", { percentage: discount.percentage })}
          </Badge>
        </>
      )}
    </div>
  );
}

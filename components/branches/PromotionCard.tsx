"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, Flame } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/types/i18n";
import type { LocalizedPromotion } from "@/types/promotion";

import { PromotionPrice } from "./PromotionPrice";

export interface PromotionCardProps {
  promotion: LocalizedPromotion;
  /** Magasin dans le contexte duquel cette promotion est affichée — sert
   * uniquement au marquage analytics (§18), jamais à un recalcul de données. */
  branchId: string;
  locale: AppLocale;
  className?: string;
}

/**
 * Formate une date calendaire "YYYY-MM-DD" (jamais un horodatage — voir
 * `lib/promotions/filter.ts`) en date localisée lisible, SANS jamais passer
 * par le fuseau du serveur : les composants année/mois/jour sont lus
 * directement dans la chaîne puis reconstruits en UTC (`Date.UTC`), et
 * `timeZone: "UTC"` force `Intl.DateTimeFormat` à les restituer tels quels —
 * même précaution de fuseau explicite que `lib/opening-hours/timezone.ts`.
 * Fonction PARTAGÉE : seul `PromotionCard` en a besoin désormais (Phase 9),
 * `BranchPromotions` ne la duplique plus (§15 : ne pas dupliquer le calcul).
 */
export function formatPromotionEndDate(isoDate: string, locale: AppLocale): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(date);
}

/**
 * Carte promotion riche (Phase 9, §1/§11) — utilisée par `BranchPromotions`
 * (fiche magasin). Deux rendus selon que la promotion porte un produit
 * structuré (`price` non `null`) ou reste une bannière éditoriale sans prix
 * (les 3 promotions historiques de la Phase 3/8) : jamais de bloc prix vide
 * ni de "0,00 ₪" inventé (§5, §11).
 *
 * Client Component : son SEUL parent (`BranchPromotions`) est déjà un Client
 * Component depuis la Phase 9 (§12, troncature "Voir toutes les
 * promotions") — `PromotionCard` était donc déjà rendue côté client de fait,
 * cette directive ne fait que le rendre explicite. Elle sert aussi à câbler
 * le marquage analytics (§18) : `promotion_view` une fois par montage réel
 * (même principe que `BranchViewTracker`, jamais côté serveur), et
 * `promotion_click` au clic sur le CTA externe — jamais de donnée
 * personnelle, uniquement `promotionId`/`branchId` (voir `lib/analytics/events.ts`).
 *
 * Le PRIX doit être l'élément visuellement dominant (§11, impératif) — voir
 * `PromotionPrice` (`size="lg"`), rendu juste après le nom du produit, avant
 * la description. `isFeatured` (§10) pilote uniquement la mise en avant
 * visuelle (icône flamme + accroche colorée) — jamais le contenu affiché.
 */
export function PromotionCard({ promotion, branchId, locale, className }: PromotionCardProps) {
  const t = useTranslations("branchDetail.promotions");
  const hasPrice = promotion.price !== null;

  useEffect(() => {
    track({ name: "promotion_view", promotionId: promotion.id, branchId });
  }, [promotion.id, branchId]);

  return (
    <Card className={cn("overflow-hidden py-0", className)}>
      {promotion.image && (
        <div className="relative aspect-[16/9] w-full bg-muted">
          <Image
            src={promotion.image}
            alt={promotion.productName ?? promotion.title}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
            unoptimized={promotion.image.startsWith("/uploads/promotions/")}
          />
        </div>
      )}

      <CardContent className="flex flex-col gap-2 p-4">
        <div className={cn("flex items-center gap-1.5", promotion.isFeatured && "text-destructive")}>
          {promotion.isFeatured && <Flame className="size-4 shrink-0" aria-hidden="true" />}
          <span className="text-sm font-semibold">{promotion.title}</span>
        </div>

        {promotion.productName && (
          <p className="text-lg font-semibold leading-snug">{promotion.productName}</p>
        )}

        {hasPrice && promotion.price && (
          <PromotionPrice
            price={promotion.price}
            originalPrice={promotion.originalPrice}
            currency={promotion.currency}
            unit={promotion.unit}
            locale={locale}
            size="lg"
          />
        )}

        {promotion.description && (
          <p className="text-sm text-muted-foreground">{promotion.description}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {t("period", { endDate: formatPromotionEndDate(promotion.endDate, locale) })}
        </p>

        {promotion.ctaUrl && (
          <Button asChild variant="outline" size="sm" className="mt-1 w-fit gap-1.5">
            <a
              href={promotion.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track({ name: "promotion_click", promotionId: promotion.id, branchId })}
            >
              {promotion.ctaLabel || t("cta")}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

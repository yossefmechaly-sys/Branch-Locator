"use client";

import { Flame, MapPin, Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { BranchStatus } from "@/components/branches/BranchStatus";
import { DistanceBadge } from "@/components/branches/DistanceBadge";
import { PromotionPrice } from "@/components/branches/PromotionPrice";
import { cn, toTelHref, toWhatsAppHref } from "@/lib/utils";
import type { AppLocale } from "@/types/i18n";
import type { BranchSummary } from "@/types/branch";

/**
 * Contenu compact affiché quand un magasin est sélectionné depuis la carte
 * (§10) — nom, ville/adresse, statut + horaires du jour, distance si connue,
 * téléphone/WhatsApp, bouton détails, et depuis la Phase 9 (§14) un aperçu
 * compact OPTIONNEL de la promotion "du jour" (`branch.featuredPromotion`,
 * même donnée et même composant `PromotionPrice` que `BranchCard`, jamais
 * recalculés ici). Volontairement pas surchargé : les informations complètes
 * restent dans `BranchCard`/`PromotionCard` (§23 — la carte reste un
 * complément, jamais la seule source d'une information ; §14 : la carte
 * Google Maps elle-même — ses marqueurs — n'affiche AUCUNE promotion, ce
 * bloc n'apparaît que dans ce panneau/cette fiche compacte, jamais sur un
 * marqueur).
 *
 * Réutilise `BranchStatus`/`DistanceBadge` et les mêmes clés i18n que
 * `BranchCard` (`branches.*`) : même texte, même comportement RTL/LTR déjà
 * validés en Phase 4, sans dupliquer de logique (§10/§14).
 *
 * Un seul composant pour deux montages différents (§15) :
 * - `variant="panel"` : contenu d'une `google.maps.InfoWindow` (desktop),
 *   monté via `createRoot` dans `BranchMap`. L'`InfoWindow` a déjà son propre
 *   bouton de fermeture natif, positionné correctement en RTL par Google
 *   lui-même : on ne duplique pas ce bouton (le masquer de façon fiable sans
 *   dépendre de classes CSS internes non documentées n'est pas possible),
 *   `BranchMap` écoute plutôt son événement `closeclick`.
 * - `variant="sheet"` : carte fixe en bas d'écran sur mobile, rendue
 *   directement en React par `BranchMap` (pas d'`InfoWindow` native, jugée peu
 *   ergonomique au toucher — §15 explicite) — DOM entièrement à nous, donc un
 *   bouton de fermeture à nous, positionné avec `end-3` (RTL/LTR-safe).
 */
export interface BranchPopupProps {
  branch: BranchSummary;
  locale: AppLocale;
  variant: "panel" | "sheet";
  onClose: () => void;
  /** Bouton "détails" : signale au parent de mettre en évidence/faire défiler
   * jusqu'à la fiche correspondante dans la liste (et, sur mobile, de revenir
   * à l'onglet liste) — §9. Ne navigue vers aucune page dédiée (Phase 8). */
  onViewDetails: (branchId: string) => void;
  className?: string;
}

export function BranchPopup({ branch, locale, variant, onClose, onViewDetails, className }: BranchPopupProps) {
  const t = useTranslations("branches");
  const tMap = useTranslations("map");
  const showOwnCloseButton = variant === "sheet";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 bg-card text-card-foreground",
        variant === "panel"
          ? "w-72 max-w-[80vw] rounded-lg p-3.5"
          : "w-full rounded-t-xl border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg",
        className
      )}
    >
      {showOwnCloseButton && (
        <button
          type="button"
          onClick={onClose}
          aria-label={tMap("closePopup")}
          className="absolute end-3 top-3 rounded-sm p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}

      <div className={cn(showOwnCloseButton && "pe-6")}>
        <p className="font-semibold leading-tight">{branch.displayName}</p>
        <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {branch.city.name}
            {branch.district ? ` · ${branch.district}` : ""} · {branch.address}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <BranchStatus viewModel={branch.statusViewModel} />
        <DistanceBadge distanceMeters={branch.distanceMeters} locale={locale} />
      </div>

      {/* Aperçu compact promotion "du jour" (Phase 9, §14) — même condition
       * et même donnée que `BranchCard` (`branch.featuredPromotion`), jamais
       * recalculée ici : absent pour la grande majorité des magasins,
       * n'ajoute rien au panneau quand il n'y a pas de promotion réellement
       * mise en avant. */}
      {branch.featuredPromotion && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5">
          <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-destructive">
            <Flame className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {branch.featuredPromotion.productName ?? branch.featuredPromotion.title}
            </span>
          </span>
          {branch.featuredPromotion.price && (
            <PromotionPrice
              price={branch.featuredPromotion.price}
              originalPrice={branch.featuredPromotion.originalPrice}
              currency={branch.featuredPromotion.currency}
              unit={branch.featuredPromotion.unit}
              locale={locale}
              size="sm"
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {branch.whatsappNumber && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={toWhatsAppHref(branch.whatsappNumber)} target="_blank" rel="noopener noreferrer">
              {t("whatsapp")}
            </a>
          </Button>
        )}
        {branch.phone && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={toTelHref(branch.phone)}>
              <Phone className="size-3.5" />
              {t("call")}
            </a>
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ms-auto"
          onClick={() => onViewDetails(branch.id)}
        >
          {t("details")}
        </Button>
      </div>
    </div>
  );
}

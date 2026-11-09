"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Flame, MapPin, MessageCircle, Phone, Star, Store, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { BranchStatus } from "@/components/branches/BranchStatus";
import { DistanceBadge } from "@/components/branches/DistanceBadge";
import { PromotionPrice } from "@/components/branches/PromotionPrice";
import { cn, toTelHref, toWhatsAppHref } from "@/lib/utils";
import type { AppLocale } from "@/types/i18n";
import type { BranchSummary } from "@/types/branch";

export interface BranchPopupProps {
  branch: BranchSummary;
  locale: AppLocale;
  variant: "panel" | "sheet";
  onClose: () => void;
  className?: string;
}

/** The same compact store card serves Google's detached root and the mobile sheet. */
export function BranchPopup({ branch, locale, variant, onClose, className }: BranchPopupProps) {
  const t = useTranslations("branches");
  const tMap = useTranslations("map");
  const tReviews = useTranslations("reviews");
  const format = useFormatter();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  // Native links work in the detached React root of Google's InfoWindow.
  const branchHref = `/${locale}/branches/${encodeURIComponent(branch.slug)}`;
  const image = branch.mainImage && branch.mainImage !== failedImage ? branch.mainImage : null;
  const rating = branch.reviewRating;
  const average = rating.averageRating === null ? null :
    format.number(rating.averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className={cn("map-branch-popup", variant === "panel" ? "map-branch-popup-panel" : "map-branch-popup-sheet", className)}>
      <button type="button" onClick={onClose} aria-label={tMap("closePopup")} className="map-popup-close">
        <X className="size-4" aria-hidden="true" />
      </button>
      <div className="map-popup-heading">
        <a href={branchHref} className="map-popup-photo" aria-label={`${t("viewPage")} – ${branch.displayName}`}>
          {image ? <Image src={image} alt="" width={64} height={64} unoptimized
            className="size-full object-cover" onError={() => setFailedImage(image)} /> :
            <Store className="size-7" aria-hidden="true" />}
        </a>
        <div className="map-popup-title-block">
          <a href={branchHref} className="map-popup-title">{branch.displayName}</a>
          <p className="map-popup-address">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{branch.city.name}{branch.district ? ` · ${branch.district}` : ""} · {branch.address}</span>
          </p>
          {rating.total > 0 && average !== null && (
            <a href={`${branchHref}#reviews`} className="map-popup-rating"
              aria-label={tReviews("averageLabel", { rating: average, count: rating.total })}>
              <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span dir="ltr">{average} / 5</span>
              <span className="text-muted-foreground">({format.number(rating.total)})</span>
            </a>
          )}
        </div>
      </div>
      <div className="map-popup-status">
        <BranchStatus viewModel={branch.statusViewModel} saturdayEveningHours={branch.saturdayEveningHours} className="map-popup-opening" />
        <DistanceBadge distanceMeters={branch.distanceMeters} locale={locale} className="map-popup-distance" />
      </div>
      {branch.featuredPromotion && (
        <div className="map-popup-promotion">
          <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-destructive">
            <Flame className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{branch.featuredPromotion.productName ?? branch.featuredPromotion.title}</span>
          </span>
          {branch.featuredPromotion.price && <PromotionPrice price={branch.featuredPromotion.price}
            originalPrice={branch.featuredPromotion.originalPrice} currency={branch.featuredPromotion.currency}
            unit={branch.featuredPromotion.unit} locale={locale} size="sm" />}
        </div>
      )}
      {(branch.phone || branch.whatsappNumber) && <div className="map-popup-contact-actions">
        {branch.phone && <Button asChild variant="outline" size="sm">
          <a href={toTelHref(branch.phone)}><Phone className="size-3.5" aria-hidden="true" />{t("call")}</a>
        </Button>}
        {branch.whatsappNumber && <Button asChild variant="outline" size="sm">
          <a href={toWhatsAppHref(branch.whatsappNumber)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-3.5" aria-hidden="true" />{t("whatsapp")}
          </a>
        </Button>}
      </div>}
      <Button asChild size="sm" className="map-popup-primary">
        <a href={branchHref}>{t("details")}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></a>
      </Button>
    </div>
  );
}

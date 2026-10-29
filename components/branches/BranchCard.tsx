"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronDown, Flame, MapPin, Phone } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { cn, toTelHref, toWhatsAppHref } from "@/lib/utils";
import type { AppLocale } from "@/types/i18n";
import type { BranchSummary } from "@/types/branch";

import { BranchStatus } from "./BranchStatus";
import { BranchRating } from "./BranchRating";
import { DistanceBadge } from "./DistanceBadge";
import { NavigationMenu } from "./NavigationMenu";
import { OpeningHours } from "./OpeningHours";
import { PromotionPrice } from "./PromotionPrice";
import { ServiceIcon } from "./ServiceIcon";

const ESSENTIAL_SERVICES_LIMIT = 4;

export interface BranchCardProps {
  branch: BranchSummary;
  locale: AppLocale;
  isSelected: boolean;
  onSelect: (branchId: string) => void;
  onHover?: (branchId: string | null) => void;
}

export function BranchCard({ branch, locale, isSelected, onSelect, onHover }: BranchCardProps) {
  const t = useTranslations("branches");
  const [expanded, setExpanded] = useState(false);

  const visibleServices = branch.services.slice(0, ESSENTIAL_SERVICES_LIMIT);
  const hiddenServiceCount = branch.services.length - visibleServices.length;

  return (
    <Card
      data-selected={isSelected || undefined}
      onMouseEnter={() => onHover?.(branch.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "transition-colors",
        isSelected && "border-primary ring-1 ring-primary"
      )}
    >
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => {
              // Phase 10, §3 — clic sur la carte (liste), distinct de
              // `branch_view` (montage réel de la fiche détaillée complète).
              track({ name: "branch_card_click", branchId: branch.id });
              onSelect(branch.id);
            }}
            className="rounded-sm text-start font-semibold leading-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {branch.displayName}
          </button>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {branch.city.name}
              {branch.district ? ` · ${branch.district}` : ""} · {branch.address}
            </span>
          </p>
          <BranchRating rating={branch.reviewRating} slug={branch.slug} locale={locale} />
        </div>
        <DistanceBadge distanceMeters={branch.distanceMeters} locale={locale} className="shrink-0" />
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <BranchStatus viewModel={branch.statusViewModel} />

        {/*
         * Aperçu compact de la promotion "du jour" (Phase 9, §13) — rendu
         * UNIQUEMENT quand `branch.featuredPromotion` est renseigné, c'est-à-
         * dire une promotion réellement active, `isFeatured: true` ET la plus
         * prioritaire pour CE magasin (voir
         * `lib/promotions/priority.ts#selectFeaturedPromotion()`, appliqué en
         * amont par `services/branch.service.ts`). Aucun autre changement
         * n'est apporté à `BranchCard` : quand `featuredPromotion` est `null`
         * (le cas normal, la grande majorité des magasins), ce bloc entier
         * est absent et la carte reste PIXEL POUR PIXEL identique à avant la
         * Phase 9 (§13, contrainte impérative de non-régression).
         */}
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

        {visibleServices.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleServices.map((service) => (
              <Badge key={service.id} variant="outline" className="gap-1 font-normal">
                <ServiceIcon icon={service.icon} className="size-3" />
                {service.name}
              </Badge>
            ))}
            {hiddenServiceCount > 0 && (
              <Badge
                asChild
                variant="outline"
                className="cursor-pointer font-normal text-muted-foreground"
              >
                <button type="button" onClick={() => setExpanded((value) => !value)}>
                  {t("moreServicesCount", { count: hiddenServiceCount })}
                </button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {branch.whatsappNumber && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={toWhatsAppHref(branch.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
              >
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
          <NavigationMenu branch={branch} className="gap-1.5" />

          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/branches/${branch.slug}`}>
              {t("viewPage")}
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ms-auto gap-1"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("showLess") : t("details")}
            <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </Button>
        </div>

        {expanded && (
          <div className="flex flex-col gap-4 border-t pt-3">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              {branch.services.map((service) => (
                <div key={service.id} className="flex items-start gap-2">
                  <ServiceIcon icon={service.icon} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="font-medium">{service.name}</dt>
                    {service.description && <dd className="text-muted-foreground">{service.description}</dd>}
                  </div>
                </div>
              ))}
            </dl>

            <div>
              <p className="mb-1.5 text-sm font-medium">{t("openingHours")}</p>
              <OpeningHours
                openingHours={branch.openingHours}
                currentDayOfWeek={branch.statusViewModel.dayOfWeek}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

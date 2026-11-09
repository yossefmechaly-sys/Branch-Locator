"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronDown, Flame, MapPin, MessageCircle, Phone } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { cn, toTelHref, toWhatsAppHref } from "@/lib/utils";
import type { AppLocale } from "@/types/i18n";
import type { BranchSummary } from "@/types/branch";

import { BranchStatus } from "./BranchStatus";
import { BranchRating } from "./BranchRating";
import { BranchThumbnail } from "./BranchThumbnail";
import { DistanceBadge } from "./DistanceBadge";
import { NavigationMenu } from "./NavigationMenu";
import { OpeningHours } from "./OpeningHours";
import { PromotionPrice } from "./PromotionPrice";
import { ServiceIcon } from "./ServiceIcon";

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

  const selectBranch = () => {
    track({ name: "branch_card_click", branchId: branch.id });
    onSelect(branch.id);
  };

  return (
    <Card
      data-selected={isSelected || undefined}
      onMouseEnter={() => onHover?.(branch.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={(event) => {
        const target = event.target;
        // Links, controls and portaled menus keep their own actions.
        if (!(target instanceof Element) || !event.currentTarget.contains(target) ||
            target.closest("a, button, input, select, textarea, [role='button'], [role='link']")) return;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.containsNode(event.currentTarget, true)) return;
        selectBranch();
      }}
      className={cn(
        "locator-card cursor-pointer transition-colors",
        isSelected && "locator-card-selected"
      )}
    >
      <CardHeader className="locator-card-header flex-row items-start gap-3 px-0 sm:gap-4">
        <BranchThumbnail key={branch.mainImage ?? "no-photo"} src={branch.mainImage}
          name={branch.displayName} slug={branch.slug} locale={locale} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={selectBranch}
              className="min-w-0 break-words rounded-sm text-start text-lg font-bold leading-tight outline-none sm:text-xl hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {branch.displayName}
            </button>
            <DistanceBadge distanceMeters={branch.distanceMeters} locale={locale} className="shrink-0" />
          </div>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {branch.city.name}
              {branch.district ? ` · ${branch.district}` : ""} · {branch.address}
            </span>
          </p>
          <BranchRating rating={branch.reviewRating} slug={branch.slug} locale={locale} />
          <BranchStatus viewModel={branch.statusViewModel} saturdayEveningHours={branch.saturdayEveningHours} className="mt-2" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-0">
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

        <div className="locator-card-actions flex flex-wrap gap-2">
          <NavigationMenu branch={branch} className="locator-action-primary gap-1.5" />
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/branches/${branch.slug}`}>
              {t("viewPage")}
            </Link>
          </Button>
          {branch.whatsappNumber && (
            <Button asChild variant="outline" size="sm" className="size-8 shrink-0 px-0">
              <a
                href={toWhatsAppHref(branch.whatsappNumber)}
                aria-label={t("whatsapp")} title={t("whatsapp")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          )}
          {branch.phone && (
            <Button asChild variant="outline" size="sm" className="size-8 shrink-0 px-0">
              <a href={toTelHref(branch.phone)} aria-label={t("call")} title={t("call")}>
                <Phone className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ms-auto size-8 shrink-0 px-0"
            aria-expanded={expanded}
            title={expanded ? t("showLess") : t("details")}
            onClick={() => setExpanded((value) => !value)}
          >
            <span className="sr-only">{expanded ? t("showLess") : t("details")}</span>
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
                saturdayEveningHours={branch.saturdayEveningHours}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Clock3, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { LocalizedCity, LocalizedService } from "@/types/branch";
import { defaultBranchFilterState, hasActiveBranchFilters, type BranchFilterState } from "@/lib/filters/branch-filters";

/** Radix `Select.Item` n'accepte pas `value=""` — valeur sentinelle pour « tous ». */
const ALL_VALUE = "__all__";

export interface BranchFiltersProps {
  filters: BranchFilterState;
  onFiltersChange: (filters: BranchFilterState) => void;
  cities: LocalizedCity[];
  services: LocalizedService[];
  className?: string;
}

/**
 * Purement UI : reçoit l'état des filtres et les options (villes/services déjà
 * localisées) en props, n'applique jamais elle-même `lib/filters` — c'est
 * `services/branch.service.ts`, côté serveur, qui filtre réellement les données
 * (§1 : aucune donnée ni logique de filtrage codée en dur côté client).
 */
export function BranchFilters({ filters, onFiltersChange, cities, services, className }: BranchFiltersProps) {
  const t = useTranslations("branches");

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select
        value={filters.citySlug ?? ALL_VALUE}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, citySlug: value === ALL_VALUE ? null : value })
        }
      >
        <SelectTrigger size="sm" aria-label={t("filterByCity")}>
          <SelectValue placeholder={t("filterByCity")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t("allCities")}</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.slug}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.serviceSlug ?? ALL_VALUE}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, serviceSlug: value === ALL_VALUE ? null : value })
        }
      >
        <SelectTrigger size="sm" aria-label={t("filterByService")}>
          <SelectValue placeholder={t("filterByService")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t("allServices")}</SelectItem>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.slug}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        role="switch"
        aria-checked={filters.isOpenNow}
        onClick={() => onFiltersChange({ ...filters, isOpenNow: !filters.isOpenNow })}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
          filters.isOpenNow
            ? "border-success bg-success/15 text-foreground"
            : "border-input bg-background text-muted-foreground hover:bg-accent"
        )}
      >
        <Clock3 className="size-3.5" aria-hidden="true" />
        {t("openNow")}
      </button>

      {hasActiveBranchFilters(filters) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => onFiltersChange(defaultBranchFilterState)}
        >
          <X className="size-3.5" />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}

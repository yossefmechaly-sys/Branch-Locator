"use client";

import { Navigation } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDistanceMeters } from "@/lib/geolocation/distance";
import type { AppLocale } from "@/types/i18n";

/**
 * N'affiche rien tant que la distance n'est pas connue — `distanceMeters` reste
 * `null` tant que l'utilisateur n'a pas activé la géolocalisation (Phase 6,
 * `applyUserDistance`). Formatage délégué à `lib/geolocation/distance.ts`
 * (`formatDistanceMeters`), partagé avec `BranchPopup` — jamais dupliqué ici
 * (§15 Phase 6).
 */
export interface DistanceBadgeProps {
  distanceMeters: number | null;
  locale: AppLocale;
  className?: string;
}

export function DistanceBadge({ distanceMeters, locale, className }: DistanceBadgeProps) {
  if (distanceMeters === null) return null;

  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <Navigation className="size-3" aria-hidden="true" />
      {formatDistanceMeters(distanceMeters, locale)}
    </span>
  );
}

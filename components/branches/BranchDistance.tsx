"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineDistanceMeters, formatDistanceMeters } from "@/lib/geolocation/distance";
import type { AppLocale } from "@/types/i18n";

export interface BranchDistanceProps {
  latitude: number;
  longitude: number;
  locale: AppLocale;
  className?: string;
}

/**
 * Distance à ce magasin depuis la position de l'utilisateur (Phase 8, §15) —
 * réutilise EXACTEMENT `useGeolocation()` (Phase 6) et
 * `haversineDistanceMeters()`/`formatDistanceMeters()` (déjà partagées avec
 * `BranchCard`/`BranchPopup`), jamais une seconde implémentation. Aucune
 * demande de permission automatique (§15) : `requestLocation()` n'est appelé
 * qu'en réponse directe au clic sur ce bouton, exactement comme
 * `BranchSearch` (Store Locator).
 */
export function BranchDistance({ latitude, longitude, locale, className }: BranchDistanceProps) {
  const t = useTranslations("branches");
  const { state, requestLocation } = useGeolocation();

  const distanceMeters = useMemo(() => {
    if (state.status !== "granted" || !state.coordinates) return null;
    return haversineDistanceMeters(state.coordinates, { lat: latitude, lng: longitude });
  }, [state, latitude, longitude]);

  if (distanceMeters !== null) {
    return (
      <span dir="ltr" className={className}>
        {formatDistanceMeters(distanceMeters, locale)}
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={requestLocation}
      disabled={state.status === "requesting"}
    >
      <LocateFixed className="size-3.5" aria-hidden="true" />
      {t("nearMe")}
    </Button>
  );
}

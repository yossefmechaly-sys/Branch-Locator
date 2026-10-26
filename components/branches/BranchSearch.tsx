"use client";

import { LocateFixed, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GeolocationStatus } from "@/lib/geolocation/types";

export interface BranchSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Géolocalisation réelle (Phase 6) — déclenchée uniquement par ce clic, jamais automatiquement (§1). */
  onRequestLocation: () => void;
  /** Pilote l'état visuel du bouton (chargement) — la décision de désactiver
   * le bouton pendant la requête vit ici, PAS dans `BranchLocator` (§1 : la
   * logique de géolocalisation reste hors composant, mais l'AFFICHAGE de son
   * état est bien la responsabilité de ce composant UI). */
  geolocationStatus: GeolocationStatus;
  className?: string;
}

/**
 * Purement UI : ne fait aucune requête réseau elle-même — `value`/`onChange` sont
 * pilotés par `BranchLocator` (qui, via `useBranches`, applique l'anti-rebond et
 * appelle `/api/branches`). Séparé de la logique de recherche elle-même (§7).
 */
export function BranchSearch({
  value,
  onChange,
  onRequestLocation,
  geolocationStatus,
  className,
}: BranchSearchProps) {
  const t = useTranslations("branches");
  const isRequesting = geolocationStatus === "requesting";

  return (
    <div className={cn("flex flex-1 flex-col gap-3 sm:flex-row", className)}>
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="ps-9"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={isRequesting}
        onClick={onRequestLocation}
        className="w-full gap-2 sm:w-auto"
      >
        {isRequesting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed className="size-4" aria-hidden="true" />
        )}
        {t("nearMe")}
      </Button>
    </div>
  );
}

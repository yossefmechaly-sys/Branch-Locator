import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Affiché pendant le chargement différé du script Google Maps (§4) — entre le
 * montage de `BranchMap` et la résolution de `loadGoogleMaps()`. Occupe déjà
 * la même hauteur que la carte réelle pour éviter un saut de mise en page.
 */
export interface MapLoadingStateProps {
  className?: string;
}

export function MapLoadingState({ className }: MapLoadingStateProps) {
  const t = useTranslations("map");

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-80 flex-col items-center justify-center gap-2 rounded-lg border bg-muted/30 p-8 text-center",
        className
      )}
    >
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}

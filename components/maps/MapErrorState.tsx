import { MapPinOff, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Remplace la carte quand elle ne peut pas s'afficher — clé API absente,
 * échec réseau/quota du script Google Maps, ou toute erreur JS attrapée par
 * `BranchMap` (§18/§19). Le Store Locator reste pleinement utilisable sans la
 * carte : ce composant le rappelle explicitement plutôt que de laisser un
 * espace vide ambigu.
 *
 * Deux causes distinctes, deux messages :
 * - `missing_api_key` : état de développement propre (§19), aucun bouton
 *   « réessayer » — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` est figée au build,
 *   retenter sans redéployer ne changerait rien.
 * - `load_failed` : échec réseau/quota/script — proposer `onRetry` a un sens
 *   (la connexion peut revenir, le quota se réinitialiser).
 */
export interface MapErrorStateProps {
  reason: "missing_api_key" | "load_failed";
  onRetry?: () => void;
  className?: string;
}

export function MapErrorState({ reason, onRetry, className }: MapErrorStateProps) {
  const t = useTranslations("map");
  const tCommon = useTranslations("common");

  const isMissingKey = reason === "missing_api_key";

  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-80 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center",
        isMissingKey ? "border-muted-foreground/30 bg-muted/30" : "border-destructive/40 bg-destructive/5",
        className
      )}
    >
      {isMissingKey ? (
        <Settings2 className="size-8 text-muted-foreground" aria-hidden="true" />
      ) : (
        <MapPinOff className="size-8 text-destructive" aria-hidden="true" />
      )}
      <p className="font-medium text-foreground">
        {isMissingKey ? t("missingApiKeyTitle") : t("unavailableTitle")}
      </p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {isMissingKey ? t("missingApiKeyHint") : t("unavailableHint")}
      </p>
      {!isMissingKey && onRetry && (
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          {tCommon("retry")}
        </Button>
      )}
    </div>
  );
}

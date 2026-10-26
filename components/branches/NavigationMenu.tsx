"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Navigation as NavigationIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buildWazeUrl } from "@/lib/navigation/waze";
import { buildGoogleMapsUrl } from "@/lib/navigation/google-maps";
import { buildAppleMapsUrl } from "@/lib/navigation/apple-maps";
import { isAppleDevice } from "@/lib/navigation/platform";
import { track } from "@/lib/analytics/track";
import type { NavigationTarget } from "@/lib/navigation/types";
import type { BranchSummary } from "@/types/branch";

export interface NavigationMenuProps {
  /** `BranchSummary` suffit (Store Locator) ; `BranchDetail` (fiche magasin,
   * Phase 8) ajoute `wazeUrlOverride` — accepté ici en surcharge optionnelle
   * plutôt qu'en dupliquant ce composant, pour ne JAMAIS reconstruire l'URL
   * Waze soi-même (§16 Phase 8) : `buildWazeUrl()` gère déjà la priorité de
   * l'override quand il est présent. */
  branch: BranchSummary & { wazeUrlOverride?: string | null };
  className?: string;
}

type NavigationAppId = "waze" | "googleMaps" | "appleMaps";

interface NavigationAppOption {
  id: NavigationAppId;
  href: string;
}

/**
 * Menu d'action « Navigation » (§9-§12 Phase 6) — remplace le bouton
 * désactivé de `BranchCard`. Rend LUI-MÊME le déclencheur (bouton visible sur
 * la fiche) et le contenu du menu (`Sheet`, bas d'écran, universel mobile +
 * desktop — §12 : pas de composant distinct par plateforme). Trois liens
 * externes réels (`<a target="_blank">`) construits via `lib/navigation/*` —
 * ce composant n'assemble JAMAIS une URL lui-même (§23).
 *
 * Priorité d'affichage : sur un appareil Apple détecté (§12, non critique —
 * `isAppleDevice` ne fait que réordonner, jamais bloquer une option), Apple
 * Maps apparaît en tête ; sinon Waze est prioritaire (option la plus utilisée
 * en Israël pour ce cas d'usage).
 */
export function NavigationMenu({ branch, className }: NavigationMenuProps) {
  const t = useTranslations("navigation");
  const tBranches = useTranslations("branches");
  const [open, setOpen] = useState(false);

  const options = useMemo<NavigationAppOption[]>(() => {
    const target: NavigationTarget = {
      latitude: branch.latitude,
      longitude: branch.longitude,
      address: `${branch.address}, ${branch.city.name}`,
      wazeUrlOverride: branch.wazeUrlOverride,
    };

    const all: NavigationAppOption[] = [
      { id: "waze", href: buildWazeUrl(target) },
      { id: "googleMaps", href: buildGoogleMapsUrl(target) },
      { id: "appleMaps", href: buildAppleMapsUrl(target) },
    ];

    const preferApple = typeof navigator !== "undefined" && isAppleDevice(navigator.userAgent);
    if (!preferApple) return all;

    return [...all].sort((a, b) => (a.id === "appleMaps" ? -1 : b.id === "appleMaps" ? 1 : 0));
  }, [branch.latitude, branch.longitude, branch.address, branch.city.name, branch.wazeUrlOverride]);

  const handleOptionClick = (id: NavigationAppId) => {
    setOpen(false);
    // Noms alignés Phase 10 §3 (renommés depuis `navigation_*_click`, voir
    // `lib/analytics/events.ts`).
    if (id === "waze") track({ name: "waze_click", branchId: branch.id });
    else if (id === "googleMaps") track({ name: "google_maps_click", branchId: branch.id });
    else track({ name: "apple_maps_click", branchId: branch.id });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className}>
          <NavigationIcon className="size-3.5" />
          {tBranches("navigation")}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{t("chooseApp")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-4 pt-0">
          {options.map((option) => (
            <Button
              key={option.id}
              asChild
              variant="outline"
              className="justify-start"
              onClick={() => handleOptionClick(option.id)}
            >
              <a href={option.href} target="_blank" rel="noopener noreferrer">
                {t(option.id)}
              </a>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

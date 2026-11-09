"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

import { MapLoadingState } from "@/components/maps/MapLoadingState";
import type { AppLocale } from "@/types/i18n";
import type { BranchDetail } from "@/types/branch";

import { BranchDistance } from "./BranchDistance";

/**
 * Même chargement différé (`next/dynamic`, `ssr: false`) que `BranchLocator`
 * (Phase 4/5, §14 Phase 8 : « ne jamais réimplémenter une seconde carte
 * Google Maps ») — c'est le SEUL autre point d'import de `BranchMap` dans
 * toute l'application.
 */
const BranchMap = dynamic(() => import("@/components/maps/BranchMap").then((mod) => mod.BranchMap), {
  ssr: false,
  loading: () => <MapLoadingState />,
});

export interface BranchDetailMapProps {
  branch: BranchDetail;
  locale: AppLocale;
}

/**
 * Carte mono-magasin de la fiche détail (Phase 8, §14) — enveloppe fine
 * autour de `BranchMap`, appelée avec un tableau à un seul élément plutôt que
 * `initialData.branches` (Store Locator). `selectedBranchId` démarre déjà sur
 * ce magasin pour que sa bulle d'info soit visible d'emblée, sans clic
 * préalable.
 *
 * `BranchDistance` (§15, géolocalisation à la demande UNIQUEMENT) est affichée
 * juste à côté du titre de section plutôt qu'à l'intérieur de la carte : elle
 * ne pilote jamais `BranchMap` (pas de marqueur de position utilisateur ici,
 * contrairement au Store Locator) — simple texte informatif, cohérent avec le
 * fait qu'une fiche magasin n'a qu'un seul point à montrer, pas un nuage de
 * résultats à recentrer.
 */
export function BranchDetailMap({ branch, locale }: BranchDetailMapProps) {
  const t = useTranslations("branchDetail.location");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branch.id);

  const branches = useMemo(() => [branch], [branch]);

  return (
    <section aria-labelledby="branch-location-heading" className="branch-detail-map branch-detail-card flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="branch-location-heading" className="branch-detail-section-heading">
          <MapPin aria-hidden="true" />
          {t("sectionTitle")}
        </h2>
        <BranchDistance latitude={branch.latitude} longitude={branch.longitude} locale={locale} />
      </div>

      <p className="text-sm text-muted-foreground">{branch.address}, {branch.city.name}</p>

      <BranchMap
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        locale={locale}
        className="branch-detail-map-canvas h-[280px]"
      />
    </section>
  );
}

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import type { AppLocale } from "@/types/i18n";
import type { BranchSummary } from "@/types/branch";
import type { BranchesFetchStatus } from "@/hooks/useBranches";

import { BranchCard } from "./BranchCard";
import { BranchListSkeleton } from "./BranchListSkeleton";
import { BranchListEmptyState } from "./BranchListEmptyState";
import { BranchListErrorState } from "./BranchListErrorState";

export interface BranchListProps {
  branches: BranchSummary[];
  status: BranchesFetchStatus;
  locale: AppLocale;
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
  onHoverBranch?: (branchId: string | null) => void;
  onRetry: () => void;
  className?: string;
}

/** Identifiant DOM stable d'une fiche — utilisé par le défilement automatique
 * ci-dessous ; exporté pour que les tests puissent cibler le même nœud sans
 * dupliquer la convention de nommage. */
export function branchCardElementId(branchId: string): string {
  return `branch-card-${branchId}`;
}

/**
 * Orchestre les états `loading` / `error` / `empty` / `success` — la seule
 * responsabilité de ce composant est de choisir lequel afficher ; le rendu de
 * chaque état vit dans son propre fichier (§7/§8).
 *
 * Seul ajout Phase 5 (§9 du cahier des charges — modification volontairement
 * minimale, §26) : un `useEffect` fait défiler la liste jusqu'à la fiche
 * sélectionnée quand la sélection change, quelle que soit son origine (clic
 * sur la fiche elle-même, ou sur un marqueur de `BranchMap`) — `"nearest"` ne
 * produit aucun mouvement si la fiche est déjà visible, donc un clic direct
 * sur une fiche déjà à l'écran ne « saute » jamais.
 */
export function BranchList({
  branches,
  status,
  locale,
  selectedBranchId,
  onSelectBranch,
  onHoverBranch,
  onRetry,
  className,
}: BranchListProps) {
  const t = useTranslations("branches");

  useEffect(() => {
    if (!selectedBranchId) return;
    document
      .getElementById(branchCardElementId(selectedBranchId))
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedBranchId]);

  if (status === "loading" && branches.length === 0) {
    return <BranchListSkeleton />;
  }

  if (status === "error") {
    return <BranchListErrorState onRetry={onRetry} />;
  }

  if (branches.length === 0) {
    return <BranchListEmptyState />;
  }

  return (
    <div className={className}>
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        {t("resultsCount", { count: branches.length })}
      </p>
      <ul className={status === "loading" ? "flex flex-col gap-3 opacity-60" : "flex flex-col gap-3"}>
        {branches.map((branch) => (
          <li key={branch.id} id={branchCardElementId(branch.id)}>
            <BranchCard
              branch={branch}
              locale={locale}
              isSelected={branch.id === selectedBranchId}
              onSelect={onSelectBranch}
              onHover={onHoverBranch}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

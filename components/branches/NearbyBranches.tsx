import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/lib/i18n/navigation";
import type { AppLocale } from "@/types/i18n";
import type { BranchSummary } from "@/types/branch";

import { BranchStatus } from "./BranchStatus";

export interface NearbyBranchesProps {
  branches: BranchSummary[];
  cityName: string;
  locale: AppLocale;
}

/**
 * Liens internes « autres magasins Maayan 2000 dans cette ville » (Phase 8,
 * §30) — Server Component pur, cartes-liens simples (pas de sélection croisée
 * avec une carte, pas d'expansion, contrairement à `BranchCard` du Store
 * Locator : cette section n'a pas la même mission, d'où un composant DÉDIÉ
 * plutôt qu'une réutilisation forcée de `BranchCard`, qui exige des callbacks
 * de sélection/survol sans objet ici — §45, changement structurel justifié
 * plutôt qu'un détournement d'un composant conçu pour un autre usage).
 *
 * Statut affiché tel que résolu au moment du chargement de la page (pas de
 * `Live`) : simple indication secondaire, pas l'exigence de fraîcheur en
 * continu qui s'applique UNIQUEMENT au statut du magasin consulté (§8).
 *
 * Rendu omis entièrement si la ville n'a aucun autre magasin actif — jamais de
 * section vide avec juste un titre (§37).
 */
export function NearbyBranches({ branches, cityName, locale }: NearbyBranchesProps) {
  const t = useTranslations("branchDetail.nearby");

  if (branches.length === 0) return null;

  return (
    <section aria-labelledby="branch-nearby-heading" className="flex flex-col gap-3">
      <h2 id="branch-nearby-heading" className="text-lg font-semibold tracking-tight">
        {t("sectionTitle", { cityName })}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {branches.map((branch) => (
          <Link key={branch.id} href={`/branches/${branch.slug}`} locale={locale} className="block">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardContent className="flex flex-col gap-1.5 p-4">
                <p className="font-medium">{branch.displayName}</p>
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>{branch.address}</span>
                </p>
                <BranchStatus viewModel={branch.statusViewModel} className="mt-1" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

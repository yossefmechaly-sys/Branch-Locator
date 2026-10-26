import { useTranslations } from "next-intl";

import type { LocalizedService } from "@/types/branch";

import { ServiceIcon } from "./ServiceIcon";

export interface BranchServicesProps {
  services: LocalizedService[];
}

/**
 * Section « Services » de la fiche magasin (Phase 8, §10) — Server Component
 * pur : `services` est déjà localisé par `services/branch.service.ts`, cette
 * liste ne fait qu'afficher. Réutilise `ServiceIcon` (Phase 4) exactement
 * comme `BranchCard` — pas une seconde table icône→service.
 *
 * Contrairement à `BranchCard` (qui tronque à 4 + bouton « voir plus », faute
 * de place dans une carte de liste), la fiche détail affiche TOUJOURS la
 * liste complète avec sa description — c'est tout l'intérêt de cette page
 * (§10 : « affichage plus complet qu'en liste »).
 */
export function BranchServices({ services }: BranchServicesProps) {
  const t = useTranslations("branchDetail.services");

  return (
    <section aria-labelledby="branch-services-heading" className="flex flex-col gap-3">
      <h2 id="branch-services-heading" className="text-lg font-semibold tracking-tight">
        {t("sectionTitle")}
      </h2>

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="flex items-start gap-2.5">
              <ServiceIcon icon={service.icon} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-sm font-medium">{service.name}</dt>
                {service.description && (
                  <dd className="text-sm text-muted-foreground">{service.description}</dd>
                )}
              </div>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

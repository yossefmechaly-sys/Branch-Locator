"use client";

import { useTranslations } from "next-intl";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toTelHref, toWhatsAppHref } from "@/lib/utils";
import { track } from "@/lib/analytics/track";
import type { BranchDetail } from "@/types/branch";

import { NavigationMenu } from "./NavigationMenu";

export interface BranchActionsProps {
  branch: BranchDetail;
  className?: string;
}

/**
 * Les TROIS actions principales de la fiche (§7 Phase 8 : « Navigation,
 * Appeler, WhatsApp », rien d'autre — « ne surcharge pas le hero »). Client
 * Component car chaque clic doit émettre un événement analytics (§36) — un
 * lien statique ne peut pas le faire, d'où l'extraction hors du hero (Server
 * Component) plutôt qu'un `onClick` directement là-bas.
 *
 * L'absence de téléphone/WhatsApp ne fait jamais planter la page (§37) : le
 * bouton correspondant est simplement omis, exactement comme `BranchCard`
 * (Phase 4) le fait déjà pour la liste — même convention, pas une seconde
 * façon de gérer l'absence.
 *
 * WhatsApp préfère le lien de groupe (`whatsappGroupUrl`) quand il est
 * configuré, sinon le numéro individuel (§17) — jamais les deux boutons à la
 * fois pour ne pas dupliquer l'action.
 */
export function BranchActions({ branch, className }: BranchActionsProps) {
  const t = useTranslations("branches");

  const whatsappHref = branch.whatsappGroupUrl || (branch.whatsappNumber ? toWhatsAppHref(branch.whatsappNumber) : null);

  return (
    <div className={className}>
      <NavigationMenu branch={branch} />
      {branch.phone && (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a href={toTelHref(branch.phone)} onClick={() => track({ name: "phone_click", branchId: branch.id })}>
            <Phone className="size-3.5" />
            {t("call")}
          </a>
        </Button>
      )}
      {whatsappHref && (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ name: "whatsapp_click", branchId: branch.id })}
          >
            {t("whatsapp")}
          </a>
        </Button>
      )}
    </div>
  );
}

import { useTranslations } from "next-intl";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BranchStatus as BranchStatusValue, BranchStatusViewModel } from "@/types/opening-hours";
import type { VariantProps } from "class-variance-authority";

/**
 * Purement présentationnel : reçoit un `BranchStatusViewModel` DÉJÀ calculé
 * par `lib/opening-hours/view-model.ts` (via `services/branch.service.ts` côté
 * serveur, ou `lib/opening-hours/live-status.ts` côté client — §16/§17/§21
 * Phase 7) — ne fait AUCUN calcul d'horaire, de date ou de seuil lui-même. La
 * seule logique ici est la SÉLECTION de quelle clé de traduction afficher
 * parmi les champs déjà structurés du view model — jamais un calcul horaire.
 */
export interface BranchStatusProps {
  viewModel: BranchStatusViewModel;
  className?: string;
}

const STATUS_BADGE_VARIANT: Record<BranchStatusValue, VariantProps<typeof badgeVariants>["variant"]> = {
  OPEN: "success",
  CLOSING_SOON: "outline",
  OPENING_SOON: "outline",
  CLOSED: "secondary",
  TEMPORARILY_CLOSED: "destructive",
};

const STATUS_DOT_CLASS: Record<BranchStatusValue, string> = {
  OPEN: "bg-success",
  CLOSING_SOON: "bg-amber-500",
  OPENING_SOON: "bg-amber-500",
  CLOSED: "bg-muted-foreground",
  TEMPORARILY_CLOSED: "bg-destructive",
};

const STATUS_MESSAGE_KEY: Record<BranchStatusValue, "openNow" | "closed" | "openingSoon" | "closingSoon" | "temporarilyClosed"> = {
  OPEN: "openNow",
  CLOSED: "closed",
  OPENING_SOON: "openingSoon",
  CLOSING_SOON: "closingSoon",
  TEMPORARILY_CLOSED: "temporarilyClosed",
};

export function BranchStatus({ viewModel, className }: BranchStatusProps) {
  const t = useTranslations("branches");
  const { status, isSpecialDay, specialDayTitle, minutesUntilChange, closingTime, nextOpening, todayHours } =
    viewModel;

  // Badge court (§6) : libellé fixe par statut, inchangé depuis la Phase 4.
  const badgeKey =
    status === "CLOSED" && todayHours === null && !isSpecialDay ? "closedToday" : STATUS_MESSAGE_KEY[status];

  // Ligne de détail (§7/§9) : construite UNIQUEMENT à partir de champs déjà
  // calculés (`closingTime`, `minutesUntilChange`, `nextOpening`) — jamais une
  // heure ou une date recalculée ici.
  let detail: string | null = null;
  if (status === "CLOSING_SOON" && minutesUntilChange !== null) {
    detail = t("closingSoonMinutes", { minutes: minutesUntilChange });
  } else if (status === "OPEN" && closingTime) {
    detail = t("openUntil", { time: closingTime });
  } else if (status === "OPENING_SOON" && minutesUntilChange !== null) {
    detail = t("openingSoonMinutes", { minutes: minutesUntilChange });
  } else if ((status === "CLOSED" || status === "TEMPORARILY_CLOSED") && nextOpening) {
    if (nextOpening.daysFromNow === 0) {
      detail = t("opensTodayAt", { time: nextOpening.time });
    } else if (nextOpening.daysFromNow === 1) {
      detail = t("opensTomorrowAt", { time: nextOpening.time });
    } else {
      detail = t("opensInDaysAt", { days: nextOpening.daysFromNow, time: nextOpening.time });
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge variant={STATUS_BADGE_VARIANT[status]} className="gap-1.5">
        <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden="true" />
        {t(badgeKey)}
      </Badge>
      {detail && (
        <span dir="ltr" className="text-xs text-muted-foreground">
          {detail}
        </span>
      )}
      {/* Horaires exceptionnels aujourd'hui (§15) — distinct de la fermeture
          exceptionnelle (déjà couverte par le badge `temporarilyClosed`) :
          n'apparaît que quand le magasin est ouvert avec des horaires
          spéciaux (réduits/prolongés/veille de fête), pour que l'utilisateur
          comprenne que ce n'est pas l'horaire habituel. */}
      {isSpecialDay && status !== "TEMPORARILY_CLOSED" && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          {specialDayTitle ?? t("exceptionalHoursToday")}
        </span>
      )}
    </div>
  );
}

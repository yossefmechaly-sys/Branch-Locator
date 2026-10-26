import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { DayOfWeek, OpeningHoursEntry } from "@/types/opening-hours";

/**
 * Tableau des 7 jours (§13/§14 Phase 7) — purement présentationnel : reçoit
 * les horaires BRUTS déjà normalisés (`BranchSummary.openingHours`) et le jour
 * courant EN ISRAËL déjà déterminé par l'appelant (`currentDayOfWeek`, dérivé
 * du `BranchStatusViewModel`/`getIsraelNow()` côté `BranchCard`) — ce
 * composant ne calcule JAMAIS lui-même « quel jour sommes-nous » : accepter ce
 * jour en prop plutôt que le déduire d'un fuseau horaire ici garde le
 * composant testable indépendamment de toute horloge (§21).
 *
 * Noms de jours localisés via `messages/{locale}.json` (`days.*`, §14) —
 * jamais stockés en base ni codés en dur ici.
 */
export interface OpeningHoursProps {
  openingHours: readonly OpeningHoursEntry[];
  currentDayOfWeek: DayOfWeek;
  className?: string;
}

const DAY_ORDER: readonly DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

const DAY_TRANSLATION_KEY: Record<DayOfWeek, "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday"> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/** Formate les créneaux d'un jour ("08:00–13:00", "16:00–22:00") — simple
 * concaténation de chaînes déjà valides, aucun calcul horaire. */
function formatRanges(entry: OpeningHoursEntry | undefined): string[] {
  if (!entry || entry.isClosed) return [];
  const ranges: string[] = [];
  if (entry.openingTime && entry.closingTime) ranges.push(`${entry.openingTime}–${entry.closingTime}`);
  if (entry.openingTime2 && entry.closingTime2) ranges.push(`${entry.openingTime2}–${entry.closingTime2}`);
  return ranges;
}

export function OpeningHours({ openingHours, currentDayOfWeek, className }: OpeningHoursProps) {
  const t = useTranslations("branches");
  const tDays = useTranslations("days");

  return (
    <div className={cn("flex flex-col gap-0.5", className)} role="table" aria-label={t("openingHours")}>
      {DAY_ORDER.map((dayOfWeek) => {
        const entry = openingHours.find((candidate) => candidate.dayOfWeek === dayOfWeek);
        const ranges = formatRanges(entry);
        const isToday = dayOfWeek === currentDayOfWeek;

        return (
          <div
            key={dayOfWeek}
            role="row"
            data-today={isToday || undefined}
            className={cn(
              "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-md px-2 py-1 text-sm",
              isToday && "bg-accent font-semibold text-accent-foreground"
            )}
          >
            <span role="rowheader" className="flex items-center gap-1.5">
              {tDays(DAY_TRANSLATION_KEY[dayOfWeek])}
              {isToday && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {t("todayIndicator")}
                </span>
              )}
            </span>
            <span dir="ltr" className={cn("text-muted-foreground", isToday && "text-accent-foreground")}>
              {ranges.length > 0 ? ranges.join(", ") : t("closedLabel")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Input } from "@/components/ui/input";
import type { OpeningHoursEntry } from "@/types/opening-hours";

/**
 * Éditeur d'horaires hebdomadaires (Phase 9, §5) — support fermé / un
 * créneau / deux créneaux, EXACTEMENT les formes que le moteur public
 * (`lib/opening-hours/*`, Phase 7) sait déjà interpréter — aucune nouvelle
 * logique d'horaires ici, ce composant ne fait QUE collecter des valeurs
 * `OpeningHoursEntry[]`. Les créneaux traversant minuit sont refusés par
 * `lib/validators/common.ts#openingHoursEntrySchema` (§5, impératif), pas par
 * ce composant, qui affiche seulement l'erreur retournée par le serveur.
 */
export function OpeningHoursEditor({
  value,
  onChange,
}: {
  value: OpeningHoursEntry[];
  onChange: (value: OpeningHoursEntry[]) => void;
}) {
  const { dictionary } = useAdminI18n();
  const tAdmin = dictionary.branches;

  function updateDay(dayOfWeek: number, patch: Partial<OpeningHoursEntry>) {
    onChange(value.map((entry) => (entry.dayOfWeek === dayOfWeek ? { ...entry, ...patch } : entry)));
  }

  return (
    <div className="flex flex-col divide-y rounded-md border">
      {value
        .slice()
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((entry) => {
          const hasSecondSlot = entry.openingTime2 !== null || entry.closingTime2 !== null;
          return (
            <div
              key={entry.dayOfWeek}
              data-testid={`opening-hours-day-${entry.dayOfWeek}`}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="w-24 shrink-0 text-sm font-medium">{tAdmin.days[entry.dayOfWeek]}</span>

              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={entry.isClosed}
                  onChange={(e) =>
                    updateDay(entry.dayOfWeek, {
                      isClosed: e.target.checked,
                      ...(e.target.checked
                        ? { openingTime: null, closingTime: null, openingTime2: null, closingTime2: null }
                        : { openingTime: "09:00", closingTime: "18:00" }),
                    })
                  }
                />
                {tAdmin.closed}
              </label>

              {!entry.isClosed && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="time"
                    data-testid={`opening-hours-open-${entry.dayOfWeek}`}
                    className="w-28"
                    value={entry.openingTime ?? ""}
                    onChange={(e) => updateDay(entry.dayOfWeek, { openingTime: e.target.value })}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    data-testid={`opening-hours-close-${entry.dayOfWeek}`}
                    className="w-28"
                    value={entry.closingTime ?? ""}
                    onChange={(e) => updateDay(entry.dayOfWeek, { closingTime: e.target.value })}
                  />

                  <label className="ms-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={hasSecondSlot}
                      onChange={(e) =>
                        updateDay(entry.dayOfWeek, {
                          openingTime2: e.target.checked ? "16:00" : null,
                          closingTime2: e.target.checked ? "20:00" : null,
                        })
                      }
                    />
                    {tAdmin.secondSlot}
                  </label>

                  {hasSecondSlot && (
                    <>
                      <Input
                        type="time"
                        className="w-28"
                        value={entry.openingTime2 ?? ""}
                        onChange={(e) => updateDay(entry.dayOfWeek, { openingTime2: e.target.value })}
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        className="w-28"
                        value={entry.closingTime2 ?? ""}
                        onChange={(e) => updateDay(entry.dayOfWeek, { closingTime2: e.target.value })}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

/** Sept jours fermés — utilisé comme valeur initiale par `BranchForm` en
 * mode création, pour qu'un magasin ne parte jamais "ouvert par défaut" sans
 * saisie explicite. */
export function emptyWeeklyOpeningHours(): OpeningHoursEntry[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek: dayOfWeek as OpeningHoursEntry["dayOfWeek"],
    isClosed: true,
    openingTime: null,
    closingTime: null,
    openingTime2: null,
    closingTime2: null,
  }));
}

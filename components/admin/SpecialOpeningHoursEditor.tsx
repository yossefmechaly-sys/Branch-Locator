"use client";

import { Trash2 } from "lucide-react";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Forme locale de saisie — `id` est un identifiant CLIENT (pour la clé React
 * et la suppression d'une ligne), jamais envoyé tel quel au serveur (voir
 * `toPayload()` dans `BranchForm`, qui ne conserve que les champs du
 * schéma). */
export interface SpecialHoursFormEntry {
  clientId: string;
  date: string;
  title: string;
  isClosed: boolean;
  openingTime: string;
  closingTime: string;
  openingTime2: string;
  closingTime2: string;
}

/**
 * Éditeur d'horaires exceptionnels (Phase 9, §6) — date / motif / fermeture
 * complète / horaires exceptionnels / second créneau. La priorité
 * "fermeture exceptionnelle → horaires spéciaux → horaires hebdomadaires"
 * n'est PAS appliquée ici (ce composant ne fait que collecter des lignes) :
 * elle vit exclusivement dans `lib/opening-hours/resolve-day.ts` (Phase 7),
 * jamais dupliquée côté admin.
 */
export function SpecialOpeningHoursEditor({
  value,
  onChange,
}: {
  value: SpecialHoursFormEntry[];
  onChange: (value: SpecialHoursFormEntry[]) => void;
}) {
  const { dictionary } = useAdminI18n();
  const tAdmin = dictionary.branches;

  function updateEntry(clientId: string, patch: Partial<SpecialHoursFormEntry>) {
    onChange(value.map((entry) => (entry.clientId === clientId ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    onChange([
      ...value,
      {
        clientId: crypto.randomUUID(),
        date: "",
        title: "",
        isClosed: true,
        openingTime: "",
        closingTime: "",
        openingTime2: "",
        closingTime2: "",
      },
    ]);
  }

  function removeEntry(clientId: string) {
    onChange(value.filter((entry) => entry.clientId !== clientId));
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((entry) => (
        <div key={entry.clientId} className="flex flex-col gap-2 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="w-40"
              value={entry.date}
              onChange={(e) => updateEntry(entry.clientId, { date: e.target.value })}
            />
            <Input
              className="flex-1 min-w-40"
              placeholder={tAdmin.specialReasonPlaceholder}
              value={entry.title}
              onChange={(e) => updateEntry(entry.clientId, { title: e.target.value })}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(entry.clientId)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={entry.isClosed}
              onChange={(e) => updateEntry(entry.clientId, { isClosed: e.target.checked })}
            />
            {tAdmin.fullDayClosed}
          </label>

          {!entry.isClosed && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="time"
                className="w-28"
                value={entry.openingTime}
                onChange={(e) => updateEntry(entry.clientId, { openingTime: e.target.value })}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                className="w-28"
                value={entry.closingTime}
                onChange={(e) => updateEntry(entry.clientId, { closingTime: e.target.value })}
              />
              <span className="ms-2 text-xs text-muted-foreground">{tAdmin.optionalSecondSlot}</span>
              <Input
                type="time"
                className="w-28"
                value={entry.openingTime2}
                onChange={(e) => updateEntry(entry.clientId, { openingTime2: e.target.value })}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                className="w-28"
                value={entry.closingTime2}
                onChange={(e) => updateEntry(entry.clientId, { closingTime2: e.target.value })}
              />
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addEntry}>
        {tAdmin.addSpecialDate}
      </Button>
    </div>
  );
}

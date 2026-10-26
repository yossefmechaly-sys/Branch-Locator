import type { OpeningHoursEntry } from "@/types/opening-hours";

/**
 * Format d'import des horaires hebdomadaires (Phase 10, §29) — UNE colonne
 * par jour calendaire (`hours_dim` … `hours_sam`, dimanche=0 … samedi=6,
 * EXACTEMENT l'ordre `dayOfWeek` déjà utilisé par `OpeningHoursEditor`/le
 * moteur Phase 7 — voir `components/admin/OpeningHoursEditor.tsx#DAY_LABELS`).
 * Volontairement PAS de syntaxe Excel exotique (§29 : « pas de syntaxe Excel
 * impossible à comprendre ») : chaque cellule est soit vide (= fermé), soit
 * "HH:mm-HH:mm" (un créneau), soit "HH:mm-HH:mm,HH:mm-HH:mm" (deux
 * créneaux) — le même modèle fermé/un créneau/deux créneaux que le formulaire
 * admin, jamais une variante d'import plus permissive ou plus stricte.
 */

export const HOURS_COLUMN_KEYS = [
  "hours_dim",
  "hours_lun",
  "hours_mar",
  "hours_mer",
  "hours_jeu",
  "hours_ven",
  "hours_sam",
] as const;

/** `hours_dim` → dayOfWeek 0 (dimanche) … `hours_sam` → dayOfWeek 6 (samedi) —
 * même correspondance que `OpeningHoursEditor`. */
export const HOURS_COLUMN_TO_DAY: Record<(typeof HOURS_COLUMN_KEYS)[number], number> = {
  hours_dim: 0,
  hours_lun: 1,
  hours_mar: 2,
  hours_mer: 3,
  hours_jeu: 4,
  hours_ven: 5,
  hours_sam: 6,
};

const SLOT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

export type HoursCellResult =
  | { ok: true; entry: Omit<OpeningHoursEntry, "dayOfWeek"> }
  | { ok: false; error: string };

/**
 * Parse UNE cellule pour UN jour. Cellule vide/absente → fermé. Un ou deux
 * créneaux "HH:mm-HH:mm" séparés par une virgule. N'applique PAS les règles
 * d'ordre (chevauchement, créneau 2 après créneau 1) — c'est
 * `openingHoursEntrySchema` (Phase 9, §5/§27 : réutilisation stricte) qui les
 * vérifie ensuite, pour ne JAMAIS avoir deux moteurs de règles différents.
 */
export function parseHoursCell(raw: string): HoursCellResult {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: true, entry: { isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null } };
  }

  const slots = trimmed.split(",").map((s) => s.trim());
  if (slots.length > 2) {
    return { ok: false, error: `Format invalide ("${raw}") — au maximum deux créneaux séparés par une virgule` };
  }

  for (const slot of slots) {
    if (!SLOT_PATTERN.test(slot)) {
      return {
        ok: false,
        error: `Format invalide ("${raw}") — attendu "HH:mm-HH:mm" (ex. "09:00-18:00" ou "09:00-13:00,16:00-19:00")`,
      };
    }
  }

  const [first, second] = slots;
  const [openingTime, closingTime] = first.split("-");
  const entry: Omit<OpeningHoursEntry, "dayOfWeek"> = {
    isClosed: false,
    openingTime,
    closingTime,
    openingTime2: null,
    closingTime2: null,
  };
  if (second) {
    const [openingTime2, closingTime2] = second.split("-");
    entry.openingTime2 = openingTime2;
    entry.closingTime2 = closingTime2;
  }
  return { ok: true, entry };
}

/** Inverse de `parseHoursCell` (Phase 10, §31 : export réimportable à
 * l'identique) — reformate UNE entrée en cellule "HH:mm-HH:mm[,HH:mm-HH:mm]"
 * ou chaîne vide si fermé. MÊME syntaxe, un seul endroit qui la définit. */
export function formatHoursCell(entry: Omit<OpeningHoursEntry, "dayOfWeek">): string {
  if (entry.isClosed || !entry.openingTime || !entry.closingTime) return "";
  const first = `${entry.openingTime}-${entry.closingTime}`;
  if (!entry.openingTime2 || !entry.closingTime2) return first;
  return `${first},${entry.openingTime2}-${entry.closingTime2}`;
}

/**
 * Parse les 7 colonnes d'une ligne en un tableau `OpeningHoursEntry[]`
 * complet (§29). Retourne `null` (jamais un tableau partiel) si AUCUNE des 7
 * colonnes n'existe dans l'en-tête du fichier — dans ce cas l'appelant laisse
 * `openingHours: []`, exactement le comportement par défaut du schéma Phase 9
 * (`branchInputSchema.openingHours.default([])`), jamais plus strict que le
 * formulaire admin (§27).
 */
export function parseWeeklyHours(
  row: Record<string, string>,
  headerHasHoursColumns: boolean
): { ok: true; entries: OpeningHoursEntry[] | null } | { ok: false; errors: string[] } {
  if (!headerHasHoursColumns) return { ok: true, entries: null };

  const errors: string[] = [];
  const entries: OpeningHoursEntry[] = [];
  for (const key of HOURS_COLUMN_KEYS) {
    const dayOfWeek = HOURS_COLUMN_TO_DAY[key];
    const result = parseHoursCell(row[key] ?? "");
    if (!result.ok) {
      errors.push(`${key} : ${result.error}`);
      continue;
    }
    entries.push({ dayOfWeek: dayOfWeek as OpeningHoursEntry["dayOfWeek"], ...result.entry });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, entries };
}

import type { DayOfWeek, OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";
import { normalizeOpeningHours } from "./normalize";
import { resolveSpecialOpeningHours } from "./special";
import type { HoursSource } from "./slots";

export interface ResolveDayHoursInput {
  openingHours: readonly OpeningHoursEntry[];
  specialHours: readonly SpecialHoursEntry[];
}

export interface DayResolution {
  isoDate: string;
  dayOfWeek: DayOfWeek;
  /** Source d'horaires retenue après application de la priorité ci-dessous, ou
   * `null` si aucune source valide n'existe pour ce jour (§5, palier 4). */
  source: HoursSource | null;
  /** `true` si `source` (ou l'absence de source) provient d'un
   * `SpecialOpeningHours` plutôt que de l'horaire hebdomadaire normal. */
  isSpecialDay: boolean;
  specialDayTitle: string | null;
  /** `true` si le jour est fermé À CAUSE d'une fermeture exceptionnelle
   * déclarée (`SpecialOpeningHours.isClosed`) — distinct d'un simple jour de
   * repos hebdomadaire (§4 : ce cas doit produire `TEMPORARILY_CLOSED`, pas
   * `CLOSED`). */
  isExceptionalClosure: boolean;
}

/**
 * Fonction UNIQUE et centrale de résolution des horaires d'un jour donné —
 * TOUTE fonction du moteur qui a besoin de savoir « le magasin a-t-il des
 * horaires ce jour-là, et lesquels » passe par ici, jamais par sa propre
 * relecture de `openingHours`/`specialHours` (§18 : éviter toute double
 * implémentation).
 *
 * Ordre de priorité EXPLICITE (§5) :
 *  1. Fermeture exceptionnelle déclarée pour cette date (`SpecialOpeningHours.isClosed`).
 *  2. Horaires spéciaux de cette date (réduits/prolongés/veille de fête…), s'ils existent.
 *  3. Horaires hebdomadaires normaux du jour de la semaine correspondant.
 *  4. Repli fermé si aucune donnée valide n'est disponible pour ce jour.
 *
 * Ne fait AUCUNE hypothèse d'ouverture en cas de doute : l'absence de source
 * valide se traduit toujours par `source: null` (donc fermé), jamais par une
 * valeur par défaut ouverte.
 */
export function resolveDayHours(
  input: ResolveDayHoursInput,
  isoDate: string,
  dayOfWeek: DayOfWeek
): DayResolution {
  const special = resolveSpecialOpeningHours(input.specialHours, isoDate);

  if (special) {
    return {
      isoDate,
      dayOfWeek,
      source: special.isClosed ? null : special,
      isSpecialDay: true,
      specialDayTitle: special.title,
      isExceptionalClosure: special.isClosed,
    };
  }

  const weekly =
    normalizeOpeningHours(input.openingHours).find((entry) => entry.dayOfWeek === dayOfWeek) ?? null;

  return {
    isoDate,
    dayOfWeek,
    source: weekly,
    isSpecialDay: false,
    specialDayTitle: null,
    isExceptionalClosure: false,
  };
}

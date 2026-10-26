import { timeToMinutes } from "./timezone";

/**
 * Créneau horaire résolu en minutes depuis minuit, avec les chaînes "HH:mm"
 * d'origine conservées (`openingTimeRaw`/`closingTimeRaw`) pour un affichage
 * fidèle (jamais reformaté depuis les minutes — évite tout risque d'écart de
 * formatage, ex. "07:00" vs "7:00").
 */
export interface TimeSlot {
  start: number;
  end: number;
  openingTimeRaw: string;
  closingTimeRaw: string;
}

export interface HoursSource {
  isClosed: boolean;
  openingTime: string | null;
  closingTime: string | null;
  openingTime2: string | null;
  closingTime2: string | null;
}

/**
 * Extrait les créneaux exploitables d'une source d'horaires DÉJÀ normalisée
 * (`normalizeOpeningHours()`/`resolveSpecialOpeningHours()`) — support de la
 * coupure méridienne : jusqu'à deux créneaux indépendants par jour (§3).
 * Ne retourne QUE des créneaux dont les deux heures sont valides (la
 * normalisation en amont a déjà mis `null` sur tout créneau invalide) — cette
 * fonction elle-même n'a donc jamais besoin de gérer l'invalide, seulement
 * l'absent.
 */
export function getSlotsForSource(source: HoursSource): TimeSlot[] {
  if (source.isClosed) return [];

  const slots: TimeSlot[] = [];
  if (source.openingTime && source.closingTime) {
    const start = timeToMinutes(source.openingTime);
    const end = timeToMinutes(source.closingTime);
    if (start !== null && end !== null) {
      slots.push({ start, end, openingTimeRaw: source.openingTime, closingTimeRaw: source.closingTime });
    }
  }
  if (source.openingTime2 && source.closingTime2) {
    const start = timeToMinutes(source.openingTime2);
    const end = timeToMinutes(source.closingTime2);
    if (start !== null && end !== null) {
      slots.push({ start, end, openingTimeRaw: source.openingTime2, closingTimeRaw: source.closingTime2 });
    }
  }
  return slots;
}

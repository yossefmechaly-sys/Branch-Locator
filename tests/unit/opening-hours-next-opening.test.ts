import { describe, expect, it } from "vitest";

import { getNextOpeningTime } from "@/lib/opening-hours/next-opening";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";

function israelTime(utc: [number, number, number, number, number]): Date {
  const [year, monthIndex, day, hour, minute] = utc;
  return new Date(Date.UTC(year, monthIndex, day, hour, minute));
}

// dim–jeu 07:00–22:00, ven 07:00–15:00, sam fermé (comme le seed Phase 3).
const STANDARD_HOURS: OpeningHoursEntry[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek: dayOfWeek as OpeningHoursEntry["dayOfWeek"],
  isClosed: false,
  openingTime: "07:00",
  closingTime: "22:00",
  openingTime2: null,
  closingTime2: null,
}));
STANDARD_HOURS.push(
  { dayOfWeek: 5, isClosed: false, openingTime: "07:00", closingTime: "15:00", openingTime2: null, closingTime2: null },
  { dayOfWeek: 6, isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null }
);

const MERIDIAN_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 1, isClosed: false, openingTime: "08:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "22:00" },
];

/**
 * §8 : recherche « plus tard aujourd'hui → demain → jours suivants », bornée
 * à `NEXT_OPENING_SEARCH_WINDOW_DAYS` (7) jours, `null` explicite si rien
 * trouvé — jamais de boucle indéfinie.
 */
describe("getNextOpeningTime — recherche bornée (§8)", () => {
  it("trouve une ouverture PLUS TARD AUJOURD'HUI (2e créneau, coupure méridienne)", () => {
    // Lundi 05/01/2026, 14:00 heure d'Israël (pendant la coupure 13:00–16:00).
    const result = getNextOpeningTime({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 12, 0]));
    expect(result).toEqual({ isoDate: "2026-01-05", dayOfWeek: 1, time: "16:00", daysFromNow: 0 });
  });

  it("ignore un créneau déjà en cours ou passé aujourd'hui — ne le confond pas avec « la prochaine ouverture »", () => {
    // Lundi 05/01/2026, 09:00 heure d'Israël — déjà dans le premier créneau
    // (08:00–13:00) : la prochaine ouverture doit être le second créneau du
    // jour (16:00), pas le premier déjà entamé.
    const result = getNextOpeningTime({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 7, 0]));
    expect(result).toEqual({ isoDate: "2026-01-05", dayOfWeek: 1, time: "16:00", daysFromNow: 0 });
  });

  it("trouve une ouverture DEMAIN quand le magasin est fermé pour le reste de la journée", () => {
    // Dimanche 04/01/2026, 23:00 heure d'Israël (après la fermeture de 22:00).
    const result = getNextOpeningTime({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 21, 0]));
    expect(result).toEqual({ isoDate: "2026-01-05", dayOfWeek: 1, time: "07:00", daysFromNow: 1 });
  });

  it("trouve une ouverture PLUSIEURS JOURS PLUS TARD, en sautant le jour de repos hebdomadaire (samedi)", () => {
    // Vendredi 09/01/2026, 16:00 heure d'Israël (après la fermeture de 15:00) —
    // samedi est fermé, donc la prochaine ouverture est dimanche (dans 2 jours).
    const result = getNextOpeningTime({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 9, 14, 0]));
    expect(result).toEqual({ isoDate: "2026-01-11", dayOfWeek: 0, time: "07:00", daysFromNow: 2 });
  });

  it("retourne explicitement null quand aucune ouverture n'existe dans la fenêtre de 7 jours (magasin sans horaires exploitables)", () => {
    const result = getNextOpeningTime({ openingHours: [], specialHours: [] }, israelTime([2026, 0, 4, 8, 0]));
    expect(result).toBeNull();
  });

  it("la recherche reste bornée même avec une fermeture exceptionnelle qui couvre toute la fenêtre", () => {
    const specialHours: SpecialHoursEntry[] = Array.from({ length: 8 }, (_, i) => {
      const day = 4 + i; // 2026-01-04 .. 2026-01-11
      return {
        date: `2026-01-${String(day).padStart(2, "0")}`,
        title: "Travaux",
        isClosed: true,
        openingTime: null,
        closingTime: null,
        openingTime2: null,
        closingTime2: null,
      } satisfies SpecialHoursEntry;
    });
    const result = getNextOpeningTime({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 0, 4, 8, 0]));
    expect(result).toBeNull();
  });

  it("priorise les horaires spéciaux d'un jour futur dans la recherche", () => {
    // Samedi 10/01/2026 est normalement fermé, mais une ouverture spéciale est
    // déclarée ce jour-là : doit être trouvée avant le dimanche suivant.
    const specialHours: SpecialHoursEntry[] = [
      { date: "2026-01-10", title: "Ouverture spéciale", isClosed: false, openingTime: "10:00", closingTime: "14:00", openingTime2: null, closingTime2: null },
    ];
    // Vendredi 09/01/2026, 16:00 heure d'Israël (fermé pour la journée).
    const result = getNextOpeningTime({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 0, 9, 14, 0]));
    expect(result).toEqual({ isoDate: "2026-01-10", dayOfWeek: 6, time: "10:00", daysFromNow: 1 });
  });
});

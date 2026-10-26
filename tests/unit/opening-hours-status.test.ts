import { describe, expect, it } from "vitest";

import { getBranchStatus } from "@/lib/opening-hours/status";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";

/**
 * Toutes les dates de référence ci-dessous ont été calculées explicitement dans
 * le fuseau Asia/Jerusalem (voir la commande utilisée en commentaire) — le but
 * est de vérifier `getBranchStatus()` par rapport à l'heure ISRAÉLIENNE réelle,
 * indépendamment du fuseau du serveur qui exécute les tests.
 */
function israelTime(utc: [number, number, number, number, number]): Date {
  const [year, monthIndex, day, hour, minute] = utc;
  return new Date(Date.UTC(year, monthIndex, day, hour, minute));
}

// Horaires "standard" du seed (Phase 3) : dim–jeu 07:00–22:00, ven 07:00–15:00, sam fermé.
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

// Horaires à coupure méridienne (dim uniquement, pour les tests créneau double).
const MERIDIAN_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 1, isClosed: false, openingTime: "07:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "20:00" },
];

describe("getBranchStatus — horaires hebdomadaires", () => {
  it("est OPEN en milieu de journée, loin de la fermeture", () => {
    // Dimanche 04/01/2026, 10:00 heure d'Israël (référence : Date.UTC(2026,0,4,8,0)).
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 8, 0]));
    expect(result.status).toBe("OPEN");
    expect(result.todayHours).toEqual({ openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null });
    expect(result.minutesUntilChange).toBe(12 * 60);
    expect(result.isSpecialDay).toBe(false);
  });

  it("passe à CLOSING_SOON dans les 60 minutes précédant la fermeture (seuil centralisé, §6 Phase 7)", () => {
    // Dimanche 04/01/2026, 21:45 heure d'Israël — 15 min avant la fermeture (22:00).
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 19, 45]));
    expect(result.status).toBe("CLOSING_SOON");
    expect(result.minutesUntilChange).toBe(15);
  });

  it("passe à CLOSING_SOON exactement à 60 minutes de la fermeture (borne inclusive)", () => {
    // Dimanche 04/01/2026, 21:00 heure d'Israël — exactement 60 min avant 22:00.
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 19, 0]));
    expect(result.status).toBe("CLOSING_SOON");
    expect(result.minutesUntilChange).toBe(60);
  });

  it("reste OPEN à 61 minutes de la fermeture (juste hors du seuil)", () => {
    // Dimanche 04/01/2026, 20:59 heure d'Israël — 61 min avant 22:00.
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 18, 59]));
    expect(result.status).toBe("OPEN");
    expect(result.minutesUntilChange).toBe(61);
  });

  it("reste OPEN un vendredi en milieu de journée (horaires raccourcis)", () => {
    // Vendredi 09/01/2026, 12:00 heure d'Israël — 3h avant la fermeture de 15:00.
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 9, 10, 0]));
    expect(result.status).toBe("OPEN");
    expect(result.todayHours?.closingTime).toBe("15:00");
  });

  it("est CLOSED après l'heure de fermeture (mais affiche encore les horaires du jour)", () => {
    // Vendredi 09/01/2026, 15:10 heure d'Israël — 10 min après la fermeture (15:00).
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 9, 13, 10]));
    expect(result.status).toBe("CLOSED");
    expect(result.todayHours).toEqual({ openingTime: "07:00", closingTime: "15:00", openingTime2: null, closingTime2: null });
    expect(result.minutesUntilChange).toBeNull();
  });

  it("est CLOSED le samedi (jour de repos), sans horaires du jour", () => {
    // Samedi 10/01/2026, 12:00 heure d'Israël.
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 10, 10, 0]));
    expect(result.status).toBe("CLOSED");
    expect(result.todayHours).toBeNull();
    expect(result.isSpecialDay).toBe(false);
  });
});

describe("getBranchStatus — coupure méridienne (deux créneaux)", () => {
  it("est OPEN dans le premier créneau", () => {
    // Lundi 05/01/2026, 08:00 heure d'Israël (créneau 07:00–13:00).
    const result = getBranchStatus({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 6, 0]));
    expect(result.status).toBe("OPEN");
  });

  it("est CLOSED pendant la coupure, loin de la réouverture", () => {
    // Lundi 05/01/2026, 14:00 heure d'Israël — entre les deux créneaux (13:00–16:00).
    const result = getBranchStatus({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 12, 0]));
    expect(result.status).toBe("CLOSED");
    // Les horaires du jour restent affichés même pendant la coupure.
    expect(result.todayHours?.openingTime2).toBe("16:00");
  });

  it("passe à OPENING_SOON dans les 60 minutes précédant la réouverture du 2e créneau (§6 Phase 7)", () => {
    // Lundi 05/01/2026, 15:45 heure d'Israël — 15 min avant la réouverture (16:00).
    const result = getBranchStatus({ openingHours: MERIDIAN_HOURS, specialHours: [] }, israelTime([2026, 0, 5, 13, 45]));
    expect(result.status).toBe("OPENING_SOON");
    expect(result.minutesUntilChange).toBe(15);
  });
});

describe("getBranchStatus — horaires spéciaux (jours fériés)", () => {
  it("un jour spécial ouvert avec horaires réduits prévaut sur les horaires hebdomadaires", () => {
    const specialHours: SpecialHoursEntry[] = [
      {
        date: "2026-09-11",
        title: "Veille de Roch Hachana",
        isClosed: false,
        openingTime: "07:00",
        closingTime: "14:00",
        openingTime2: null,
        closingTime2: null,
      },
    ];
    // Vendredi 11/09/2026, 11:00 heure d'Israël (DST, UTC+3) — l'horaire hebdo du
    // vendredi dirait 07:00–15:00, mais l'horaire spécial (07:00–14:00) prévaut ;
    // 3h avant la fermeture spéciale, largement hors du seuil CLOSING_SOON (60 min).
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 8, 11, 8, 0]));
    expect(result.isSpecialDay).toBe(true);
    expect(result.specialDayTitle).toBe("Veille de Roch Hachana");
    expect(result.status).toBe("OPEN");
    expect(result.todayHours?.closingTime).toBe("14:00");
  });

  it("un jour spécial fermé donne TEMPORARILY_CLOSED, distinct de CLOSED", () => {
    const specialHours: SpecialHoursEntry[] = [
      {
        date: "2026-09-12",
        title: "Roch Hachana",
        isClosed: true,
        openingTime: null,
        closingTime: null,
        openingTime2: null,
        closingTime2: null,
      },
    ];
    // Samedi 12/09/2026, 13:00 heure d'Israël.
    const result = getBranchStatus({ openingHours: STANDARD_HOURS, specialHours }, israelTime([2026, 8, 12, 10, 0]));
    expect(result.status).toBe("TEMPORARILY_CLOSED");
    expect(result.isSpecialDay).toBe(true);
    expect(result.specialDayTitle).toBe("Roch Hachana");
    expect(result.todayHours).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { buildBranchStatusViewModel } from "@/lib/opening-hours/view-model";
import type { OpeningHoursEntry } from "@/types/opening-hours";

function israelTime(utc: [number, number, number, number, number]): Date {
  const [year, monthIndex, day, hour, minute] = utc;
  return new Date(Date.UTC(year, monthIndex, day, hour, minute));
}

const STANDARD_HOURS: OpeningHoursEntry[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek: dayOfWeek as OpeningHoursEntry["dayOfWeek"],
  isClosed: false,
  openingTime: "07:00",
  closingTime: "22:00",
  openingTime2: null,
  closingTime2: null,
}));
STANDARD_HOURS.push({ dayOfWeek: 5, isClosed: false, openingTime: "07:00", closingTime: "15:00", openingTime2: null, closingTime2: null });
STANDARD_HOURS.push({ dayOfWeek: 6, isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null });

/**
 * Vérifie la composition de `buildBranchStatusViewModel()` (§16/§17/§21) :
 * `closingTime` uniquement quand ouvert, `nextOpening` uniquement quand
 * fermé, `dayOfWeek` toujours renseigné — jamais les deux à la fois.
 */
describe("buildBranchStatusViewModel — composition (§21)", () => {
  it("quand le magasin est OUVERT : closingTime renseigné, nextOpening null", () => {
    const result = buildBranchStatusViewModel({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 8, 0]));
    expect(result.status).toBe("OPEN");
    expect(result.closingTime).toBe("22:00");
    expect(result.nextOpening).toBeNull();
    expect(result.dayOfWeek).toBe(0);
  });

  it("quand le magasin est FERMÉ : nextOpening renseigné, closingTime null", () => {
    // Vendredi 09/01/2026, 16:00 heure d'Israël (fermé, samedi fermé, prochaine ouverture dimanche).
    const result = buildBranchStatusViewModel({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 9, 14, 0]));
    expect(result.status).toBe("CLOSED");
    expect(result.closingTime).toBeNull();
    expect(result.nextOpening).toEqual({ isoDate: "2026-01-11", dayOfWeek: 0, time: "07:00", daysFromNow: 2 });
  });

  it("quand le magasin est CLOSING_SOON (toujours physiquement ouvert) : closingTime renseigné, nextOpening null", () => {
    const result = buildBranchStatusViewModel({ openingHours: STANDARD_HOURS, specialHours: [] }, israelTime([2026, 0, 4, 19, 45]));
    expect(result.status).toBe("CLOSING_SOON");
    expect(result.closingTime).toBe("22:00");
    expect(result.nextOpening).toBeNull();
  });

  it("quand aucune prochaine ouverture n'existe dans la fenêtre de recherche : nextOpening reste explicitement null", () => {
    const result = buildBranchStatusViewModel({ openingHours: [], specialHours: [] }, israelTime([2026, 0, 4, 8, 0]));
    expect(result.status).toBe("CLOSED");
    expect(result.nextOpening).toBeNull();
  });

  it("reste cohérent avec getBranchStatus/getClosingTime quand ouvert (closingTime seulement)", async () => {
    const { getBranchStatus } = await import("@/lib/opening-hours/status");
    const { getClosingTime } = await import("@/lib/opening-hours/closing");

    const referenceDate = israelTime([2026, 0, 4, 8, 0]);
    const input = { openingHours: STANDARD_HOURS, specialHours: [] };
    const viewModel = buildBranchStatusViewModel(input, referenceDate);
    const statusResult = getBranchStatus(input, referenceDate);

    expect(viewModel.status).toBe(statusResult.status);
    expect(viewModel.todayHours).toEqual(statusResult.todayHours);
    expect(viewModel.minutesUntilChange).toBe(statusResult.minutesUntilChange);
    expect(viewModel.closingTime).toBe(getClosingTime(input, referenceDate));
    // Le magasin est OUVERT à ce `referenceDate` : `nextOpening` reste null,
    // même si `getNextOpeningTime()` appelée isolément retournerait une valeur
    // (elle ignore le statut courant) — c'est `buildBranchStatusViewModel()`
    // qui applique la règle « nextOpening seulement si fermé » (§21).
    expect(viewModel.nextOpening).toBeNull();
  });

  it("reste cohérent avec getNextOpeningTime quand fermé (nextOpening seulement)", async () => {
    const { getNextOpeningTime } = await import("@/lib/opening-hours/next-opening");

    // Vendredi 09/01/2026, 16:00 heure d'Israël (fermé).
    const referenceDate = israelTime([2026, 0, 9, 14, 0]);
    const input = { openingHours: STANDARD_HOURS, specialHours: [] };
    const viewModel = buildBranchStatusViewModel(input, referenceDate);

    expect(viewModel.closingTime).toBeNull();
    expect(viewModel.nextOpening).toEqual(getNextOpeningTime(input, referenceDate));
  });
});

import { describe, expect, it } from "vitest";

import { refreshBranchStatuses } from "@/lib/opening-hours/live-status";
import { buildBranchStatusViewModel } from "@/lib/opening-hours/view-model";
import { makeBranchSummary } from "./helpers/branch-fixture";

function israelTime(utc: [number, number, number, number, number]): Date {
  const [year, monthIndex, day, hour, minute] = utc;
  return new Date(Date.UTC(year, monthIndex, day, hour, minute));
}

const OPEN_HOURS = [
  { dayOfWeek: 0 as const, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
];

/**
 * §19/§20 : rafraîchissement client léger, sans appel réseau, en réutilisant
 * EXACTEMENT `buildBranchStatusViewModel()` (§18 : pas de seconde
 * implémentation) — et §17 : « le statut affiché en liste et sur la carte ne
 * doit jamais diverger ».
 */
describe("refreshBranchStatuses — rafraîchissement client sans refetch (§19/§20)", () => {
  it("recalcule statusViewModel en réutilisant exactement buildBranchStatusViewModel (§18)", () => {
    const referenceDate = israelTime([2026, 0, 4, 8, 0]);
    const branch = makeBranchSummary({ id: "b1", openingHours: OPEN_HOURS, specialHours: [] });

    const [refreshed] = refreshBranchStatuses([branch], referenceDate);
    const expected = buildBranchStatusViewModel({ openingHours: OPEN_HOURS, specialHours: [] }, referenceDate);

    expect(refreshed.statusViewModel).toEqual(expected);
    expect(refreshed.status).toBe(expected.status);
    expect(refreshed.todayHours).toEqual(expected.todayHours);
    expect(refreshed.isSpecialDay).toBe(expected.isSpecialDay);
    expect(refreshed.specialDayTitle).toBe(expected.specialDayTitle);
    expect(refreshed.minutesUntilChange).toBe(expected.minutesUntilChange);
  });

  it("conserve toutes les autres propriétés du magasin inchangées (id, distance, position…)", () => {
    const branch = makeBranchSummary({ id: "b1", openingHours: OPEN_HOURS, specialHours: [], distanceMeters: 1234, latitude: 31.8, longitude: 35.2 });
    const [refreshed] = refreshBranchStatuses([branch], israelTime([2026, 0, 4, 8, 0]));
    expect(refreshed.id).toBe("b1");
    expect(refreshed.distanceMeters).toBe(1234);
    expect(refreshed.latitude).toBe(31.8);
    expect(refreshed.longitude).toBe(35.2);
  });

  it("ne perd, ne réordonne, ni ne duplique aucun magasin de la liste", () => {
    const branches = [
      makeBranchSummary({ id: "a", openingHours: OPEN_HOURS, specialHours: [] }),
      makeBranchSummary({ id: "b", openingHours: OPEN_HOURS, specialHours: [] }),
      makeBranchSummary({ id: "c", openingHours: OPEN_HOURS, specialHours: [] }),
    ];
    const refreshed = refreshBranchStatuses(branches, israelTime([2026, 0, 4, 8, 0]));
    expect(refreshed.map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("§19 : un magasin ouvert à 21:55 passe bien à fermé à 22:01 lors du rafraîchissement suivant (pas de statut figé)", () => {
    const branch = makeBranchSummary({ id: "b1", openingHours: OPEN_HOURS, specialHours: [] });

    // Dimanche 04/01/2026, 21:55 heure d'Israël = 19:55 UTC.
    const [before] = refreshBranchStatuses([branch], israelTime([2026, 0, 4, 19, 55]));
    expect(before.status).toBe("CLOSING_SOON");

    // Dimanche 04/01/2026, 22:01 heure d'Israël = 20:01 UTC — un rafraîchissement
    // ultérieur (déclenché par le timer central `useNow()`, §20) doit refléter
    // la fermeture, jamais garder l'ancien statut « ouvert ».
    const [after] = refreshBranchStatuses([branch], israelTime([2026, 0, 4, 20, 1]));
    expect(after.status).toBe("CLOSED");
  });

  it("produit un résultat identique pour deux appels avec le même referenceDate — liste et carte ne divergent jamais (§17)", () => {
    const branch = makeBranchSummary({ id: "b1", openingHours: OPEN_HOURS, specialHours: [] });
    const referenceDate = israelTime([2026, 0, 4, 19, 45]);
    const [forList] = refreshBranchStatuses([branch], referenceDate);
    const [forMap] = refreshBranchStatuses([branch], referenceDate);
    expect(forList.statusViewModel).toEqual(forMap.statusViewModel);
  });
});

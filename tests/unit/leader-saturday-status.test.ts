import { describe, expect, it } from "vitest";

import saturdayHours from "@/leader-saturday-hours.json";
import { buildBranchStatusViewModel } from "@/lib/opening-hours/view-model";
import type { OpeningHoursEntry } from "@/types/opening-hours";

const openingHours: OpeningHoursEntry[] = [];

function israelDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  // En janvier, Israël est en UTC+2.
  return new Date(Date.UTC(year, month - 1, day, hour - 2, minute));
}

function statusAt(
  date: Date,
  closingTime: string | null,
  specialHours: Parameters<typeof buildBranchStatusViewModel>[0]["specialHours"] = []
) {
  return buildBranchStatusViewModel(
    {
      openingHours,
      specialHours,
      saturdayEveningHours: closingTime
        ? {
            openingRule: "ONE_HOUR_AFTER_SHABBAT",
            closingTime,
            officialTextHe: "",
          }
        : null,
    },
    date
  );
}

describe("Leader — statut samedi soir", () => {
  for (const [code, config] of Object.entries(saturdayHours)) {
    it(`magasin ${code} : transition exacte à ${config.closingTime}`, () => {
      const [hour, minute] = config.closingTime.split(":").map(Number);
      const before = new Date(
        israelDate(2026, 1, 10, hour, minute).getTime() - 60_000
      );
      const atClosing = israelDate(2026, 1, 10, hour, minute);

      const beforeStatus = statusAt(before, config.closingTime);
      const afterStatus = statusAt(atClosing, config.closingTime);

      expect(beforeStatus.status).toBe("HOURS_UNCONFIRMED");
      expect(beforeStatus.nextOpening).toBeNull();
      expect(beforeStatus.closingTime).toBeNull();

      expect(afterStatus.status).toBe("CLOSED");
    });
  }

  it("respecte une fermeture exceptionnelle le samedi", () => {
    const result = statusAt(
      israelDate(2026, 1, 10, 21, 0),
      "23:00",
      [{
        date: "2026-01-10",
        title: "Fermeture exceptionnelle",
        isClosed: true,
        openingTime: null,
        closingTime: null,
        openingTime2: null,
        closingTime2: null,
      }]
    );

    expect(result.status).toBe("TEMPORARILY_CLOSED");
    expect(result.isSpecialDay).toBe(true);
    expect(result.specialDayTitle).toBe("Fermeture exceptionnelle");
  });

  it("respecte les horaires exceptionnels explicites", () => {
    const specialHours = [{
      date: "2026-01-10",
      title: "Ouverture exceptionnelle",
      isClosed: false,
      openingTime: "20:00",
      closingTime: "22:00",
      openingTime2: null,
      closingTime2: null,
    }];

    const during = statusAt(
      israelDate(2026, 1, 10, 20, 30),
      "23:00",
      specialHours
    );

    const after = statusAt(
      israelDate(2026, 1, 10, 22, 30),
      "23:00",
      specialHours
    );

    expect(during.status).toBe("OPEN");
    expect(during.isSpecialDay).toBe(true);
    expect(after.status).toBe("CLOSED");
    expect(after.isSpecialDay).toBe(true);
  });

  it("ignore une exception prévue pour une autre date", () => {
    const result = statusAt(
      israelDate(2026, 1, 10, 21, 0),
      "23:00",
      [{
        date: "2026-01-11",
        title: "Fermeture du dimanche",
        isClosed: true,
        openingTime: null,
        closingTime: null,
        openingTime2: null,
        closingTime2: null,
      }]
    );

    expect(result.status).toBe("HOURS_UNCONFIRMED");
    expect(result.isSpecialDay).toBe(false);
  });

  it("ne modifie pas le statut d'un magasin sans règle spéciale", () => {
    const result = statusAt(israelDate(2026, 1, 10, 21, 0), null);
    expect(result.status).toBe("CLOSED");
  });

  it("ne modifie pas les autres jours", () => {
    const result = statusAt(israelDate(2026, 1, 11, 21, 0), "23:00");
    expect(result.status).toBe("CLOSED");
  });
});

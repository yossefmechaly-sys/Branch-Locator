import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { BranchStatus } from "@/components/branches/BranchStatus";
import type { BranchStatusViewModel } from "@/types/opening-hours";
import type { SaturdayEveningHours } from "@/types/branch";

import { renderWithIntl } from "./helpers/render-with-intl";

const SATURDAY_HOURS: SaturdayEveningHours = {
  openingRule: "ONE_HOUR_AFTER_SHABBAT",
  closingTime: "23:00",
  officialTextHe: "שעה אחרי צאת השבת עד 23:00",
};

function makeStatus(
  overrides: Partial<BranchStatusViewModel> = {}
): BranchStatusViewModel {
  return {
    status: "CLOSED",
    dayOfWeek: 6,
    todayHours: null,
    isSpecialDay: false,
    specialDayTitle: null,
    minutesUntilChange: null,
    closingTime: null,
    nextOpening: null,
    ...overrides,
  };
}

describe("Leader — badge du samedi soir", () => {
  it("affiche Fermé aujourd'hui quand le magasin concerné est fermé", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={makeStatus()}
        saturdayEveningHours={SATURDAY_HOURS}
      />
    );

    expect(screen.getByText("Closed today")).toBeTruthy();
    expect(screen.queryByText("Opens after Shabbat")).toBeNull();
  });

  it("affiche Horaires non confirmés quand le statut est incertain", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={makeStatus({ status: "HOURS_UNCONFIRMED" })}
        saturdayEveningHours={SATURDAY_HOURS}
      />
    );

    expect(screen.getByText("Hours unconfirmed")).toBeTruthy();
    expect(screen.queryByText("Opens after Shabbat")).toBeNull();
  });

  it("conserve Fermé aujourd'hui pour un magasin sans ouverture samedi soir", () => {
    renderWithIntl(
      <BranchStatus viewModel={makeStatus()} saturdayEveningHours={null} />
    );

    expect(screen.getByText("Closed today")).toBeTruthy();
  });

  it("respecte une fermeture exceptionnelle", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={makeStatus({
          status: "TEMPORARILY_CLOSED",
          isSpecialDay: true,
        })}
        saturdayEveningHours={SATURDAY_HOURS}
      />
    );

    expect(screen.queryByText("Opens after Shabbat")).toBeNull();
    expect(screen.getByText("Temporarily closed")).toBeTruthy();
  });

  it("ne montre pas le message du samedi un autre jour", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={makeStatus({ dayOfWeek: 5 })}
        saturdayEveningHours={SATURDAY_HOURS}
      />
    );

    expect(screen.queryByText("Opens after Shabbat")).toBeNull();
  });
});

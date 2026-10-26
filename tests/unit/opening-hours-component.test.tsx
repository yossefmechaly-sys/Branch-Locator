import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { OpeningHours } from "@/components/branches/OpeningHours";
import type { OpeningHoursEntry } from "@/types/opening-hours";

import { renderWithIntl } from "./helpers/render-with-intl";

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

const SPLIT_HOURS: OpeningHoursEntry[] = [
  { dayOfWeek: 1, isClosed: false, openingTime: "08:00", closingTime: "13:00", openingTime2: "16:00", closingTime2: "22:00" },
];

/**
 * §13/§14/§23 : les 7 jours, la mise en évidence du jour courant, l'affichage
 * des deux créneaux, et la localisation des noms de jour.
 */
describe("OpeningHours — tableau des 7 jours (§13)", () => {
  it("affiche les 7 jours, dimanche à samedi", () => {
    renderWithIntl(<OpeningHours openingHours={STANDARD_HOURS} currentDayOfWeek={0} />);
    expect(screen.getAllByRole("row")).toHaveLength(7);
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].forEach((day) => {
      expect(screen.getByText(day)).toBeTruthy();
    });
  });

  it("affiche les horaires du jour, formatés en une seule chaîne", () => {
    renderWithIntl(<OpeningHours openingHours={STANDARD_HOURS} currentDayOfWeek={0} />);
    // Plusieurs jours partagent le même horaire (07:00–22:00) : on vérifie
    // qu'au moins une occurrence existe, formatée exactement ainsi.
    expect(screen.getAllByText("07:00–22:00").length).toBeGreaterThan(0);
    expect(screen.getByText("07:00–15:00")).toBeTruthy();
  });

  it("affiche « Closed » pour le jour de repos hebdomadaire (samedi)", () => {
    renderWithIntl(<OpeningHours openingHours={STANDARD_HOURS} currentDayOfWeek={0} />);
    expect(screen.getByText("Closed")).toBeTruthy();
  });

  it("affiche « Closed » pour un jour totalement absent des horaires (donnée manquante, §12)", () => {
    renderWithIntl(<OpeningHours openingHours={[]} currentDayOfWeek={0} />);
    expect(screen.getAllByText("Closed")).toHaveLength(7);
  });

  it("met en évidence le jour courant via data-today, un seul à la fois", () => {
    renderWithIntl(<OpeningHours openingHours={STANDARD_HOURS} currentDayOfWeek={3} />);
    const rows = screen.getAllByRole("row");
    const highlighted = rows.filter((row) => row.getAttribute("data-today") === "true");
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].textContent).toContain("Wednesday");
  });

  it("affiche un indicateur « Today » textuel sur le jour courant", () => {
    renderWithIntl(<OpeningHours openingHours={STANDARD_HOURS} currentDayOfWeek={0} />);
    expect(screen.getByText("Today")).toBeTruthy();
  });

  it("affiche les DEUX créneaux d'un jour à coupure méridienne, séparés (§3)", () => {
    renderWithIntl(<OpeningHours openingHours={SPLIT_HOURS} currentDayOfWeek={1} />);
    expect(screen.getByText("08:00–13:00, 16:00–22:00")).toBeTruthy();
  });
});

describe("OpeningHours — localisation (§14) et RTL (§23)", () => {
  it("traduit les noms de jour en hébreu (RTL), jamais stockés en base", () => {
    renderWithIntl(<OpeningHours openingHours={STANDARD_HOURS} currentDayOfWeek={0} />, "he");
    expect(screen.getByText("ראשון")).toBeTruthy();
    expect(screen.getByText("שבת")).toBeTruthy();
  });

  it("garde les plages horaires en dir=ltr même en contexte RTL", () => {
    renderWithIntl(<OpeningHours openingHours={STANDARD_HOURS} currentDayOfWeek={0} />, "he");
    const [hours] = screen.getAllByText("07:00–22:00");
    expect(hours.getAttribute("dir")).toBe("ltr");
  });
});

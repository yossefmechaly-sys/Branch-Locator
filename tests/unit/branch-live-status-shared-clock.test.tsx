import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { NowProvider } from "@/components/branches/NowProvider";
import { BranchStatusLive } from "@/components/branches/BranchStatusLive";
import { OpeningHoursLive } from "@/components/branches/OpeningHoursLive";
import type { OpeningHoursEntry } from "@/types/opening-hours";

import { renderWithIntl } from "./helpers/render-with-intl";

const OPENING_HOURS: OpeningHoursEntry[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek: dayOfWeek as OpeningHoursEntry["dayOfWeek"],
  isClosed: dayOfWeek === 6,
  openingTime: dayOfWeek === 6 ? null : "07:00",
  closingTime: dayOfWeek === 6 ? null : "22:00",
  openingTime2: null,
  closingTime2: null,
}));

describe("NowProvider (Phase 8, §8/§20 — un seul now partagé pour toute la fiche)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mercredi 10 juin 2026, 12:00 à Jérusalem (été, UTC+3) — magasin ouvert.
    vi.setSystemTime(new Date("2026-06-10T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("le badge de statut et le tableau des horaires restent TOUJOURS d'accord, car ils lisent le même `now`", () => {
    renderWithIntl(
      <NowProvider>
        <BranchStatusLive openingHours={OPENING_HOURS} specialHours={[]} />
        <OpeningHoursLive openingHours={OPENING_HOURS} specialHours={[]} />
      </NowProvider>
    );

    // Statut : ouvert (mercredi, 12:00 entre 07:00 et 22:00 à Jérusalem).
    expect(screen.getByText("Open now")).toBeTruthy();

    // Le jour mis en évidence dans le tableau est bien le mercredi (index 3).
    const rows = screen.getAllByRole("row");
    expect(rows[3].getAttribute("data-today")).toBe("true");
    for (const [index, row] of rows.entries()) {
      if (index !== 3) expect(row.getAttribute("data-today")).toBeNull();
    }
  });

  it("useNowContext() retombe sur une Date fraîche si utilisé hors NowProvider, sans jamais planter (§37)", () => {
    // Rendu SANS wrapper NowProvider : ne doit lever aucune erreur.
    expect(() =>
      renderWithIntl(<BranchStatusLive openingHours={OPENING_HOURS} specialHours={[]} />)
    ).not.toThrow();
  });
});

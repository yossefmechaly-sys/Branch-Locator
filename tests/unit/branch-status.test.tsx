import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { BranchStatus } from "@/components/branches/BranchStatus";
import type { BranchStatusViewModel } from "@/types/opening-hours";

import { renderWithIntl } from "./helpers/render-with-intl";

function viewModel(overrides: Partial<BranchStatusViewModel>): BranchStatusViewModel {
  return {
    status: "OPEN",
    dayOfWeek: 0,
    todayHours: { openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
    isSpecialDay: false,
    specialDayTitle: null,
    minutesUntilChange: 120,
    closingTime: "22:00",
    nextOpening: null,
    ...overrides,
  };
}

/**
 * Purement présentationnel (§16/§17) : chaque test fournit un
 * `BranchStatusViewModel` déjà calculé — jamais d'horaires bruts — pour
 * vérifier uniquement la SÉLECTION du texte affiché (§22/§23).
 */
describe("BranchStatus — sélection du message selon le statut (§7)", () => {
  it("OPEN : badge « Open now » + détail « Open until {closingTime} »", () => {
    renderWithIntl(<BranchStatus viewModel={viewModel({ status: "OPEN", closingTime: "22:00" })} />);
    expect(screen.getByText("Open now")).toBeTruthy();
    expect(screen.getByText("Open until 22:00")).toBeTruthy();
  });

  it("CLOSING_SOON : badge « Closing soon » + détail au pluriel correct (minutes)", () => {
    renderWithIntl(
      <BranchStatus viewModel={viewModel({ status: "CLOSING_SOON", minutesUntilChange: 45, closingTime: "22:00" })} />
    );
    expect(screen.getByText("Closing soon")).toBeTruthy();
    expect(screen.getByText("Closing in 45 minutes")).toBeTruthy();
  });

  it("CLOSING_SOON à 1 minute : forme singulier correcte (ICU plural)", () => {
    renderWithIntl(<BranchStatus viewModel={viewModel({ status: "CLOSING_SOON", minutesUntilChange: 1 })} />);
    expect(screen.getByText("Closing in 1 minute")).toBeTruthy();
  });

  it("OPENING_SOON : badge « Opening soon » + détail en minutes", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({ status: "OPENING_SOON", minutesUntilChange: 15, closingTime: null, todayHours: null })}
      />
    );
    expect(screen.getByText("Opening soon")).toBeTruthy();
    expect(screen.getByText("Opening in 15 minutes")).toBeTruthy();
  });

  it("CLOSED avec prochaine ouverture aujourd'hui plus tard : « Opens today at {time} »", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({
          status: "CLOSED",
          closingTime: null,
          nextOpening: { isoDate: "2026-01-04", dayOfWeek: 0, time: "16:00", daysFromNow: 0 },
        })}
      />
    );
    expect(screen.getByText("Closed now")).toBeTruthy();
    expect(screen.getByText("Opens today at 16:00")).toBeTruthy();
  });

  it("CLOSED avec prochaine ouverture demain : « Opens tomorrow at {time} »", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({
          status: "CLOSED",
          closingTime: null,
          nextOpening: { isoDate: "2026-01-05", dayOfWeek: 1, time: "07:00", daysFromNow: 1 },
        })}
      />
    );
    expect(screen.getByText("Opens tomorrow at 07:00")).toBeTruthy();
  });

  it("CLOSED avec prochaine ouverture dans plusieurs jours : « Opens in N days at {time} »", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({
          status: "CLOSED",
          closingTime: null,
          nextOpening: { isoDate: "2026-01-07", dayOfWeek: 3, time: "07:00", daysFromNow: 3 },
        })}
      />
    );
    expect(screen.getByText("Opens in 3 days at 07:00")).toBeTruthy();
  });

  it("CLOSED sans horaires du jour et sans jour spécial : badge « Closed today »", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({ status: "CLOSED", closingTime: null, todayHours: null, nextOpening: null })}
      />
    );
    expect(screen.getByText("Closed today")).toBeTruthy();
  });

  it("TEMPORARILY_CLOSED : badge dédié, distinct de CLOSED", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({
          status: "TEMPORARILY_CLOSED",
          closingTime: null,
          todayHours: null,
          isSpecialDay: true,
          specialDayTitle: "Roch Hachana",
        })}
      />
    );
    expect(screen.getByText("Temporarily closed")).toBeTruthy();
    expect(screen.queryByText("Closed today")).toBeNull();
  });
});

describe("BranchStatus — indicateur d'horaires exceptionnels (§15)", () => {
  it("affiche le titre du jour spécial quand ouvert avec des horaires réduits", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({ status: "OPEN", isSpecialDay: true, specialDayTitle: "Veille de Roch Hachana" })}
      />
    );
    expect(screen.getByText("Veille de Roch Hachana")).toBeTruthy();
  });

  it("affiche un texte générique traduit quand le titre spécial est absent", () => {
    renderWithIntl(<BranchStatus viewModel={viewModel({ status: "OPEN", isSpecialDay: true, specialDayTitle: null })} />);
    expect(screen.getByText("Exceptional hours today")).toBeTruthy();
  });

  it("n'affiche PAS l'indicateur d'horaires exceptionnels quand le statut est TEMPORARILY_CLOSED (déjà couvert par le badge)", () => {
    renderWithIntl(
      <BranchStatus
        viewModel={viewModel({
          status: "TEMPORARILY_CLOSED",
          closingTime: null,
          todayHours: null,
          isSpecialDay: true,
          specialDayTitle: "Roch Hachana",
        })}
      />
    );
    expect(screen.queryByText("Exceptional hours today")).toBeNull();
  });

  it("n'affiche aucun indicateur quand ce n'est pas un jour spécial", () => {
    renderWithIntl(<BranchStatus viewModel={viewModel({ status: "OPEN", isSpecialDay: false })} />);
    expect(screen.queryByText("Exceptional hours today")).toBeNull();
  });
});

describe("BranchStatus — RTL hébreu (§14)", () => {
  it("traduit intégralement en hébreu, sans texte codé en dur", () => {
    renderWithIntl(
      <BranchStatus viewModel={viewModel({ status: "OPEN", closingTime: "22:00" })} />,
      "he"
    );
    expect(screen.getByText("פתוח עכשיו")).toBeTruthy();
    expect(screen.getByText("פתוח עד 22:00")).toBeTruthy();
  });

  it("garde la ligne de détail en dir=ltr même en contexte RTL (heures toujours affichées en LTR)", () => {
    renderWithIntl(
      <BranchStatus viewModel={viewModel({ status: "OPEN", closingTime: "22:00" })} />,
      "he"
    );
    const detail = screen.getByText("פתוח עד 22:00");
    expect(detail.getAttribute("dir")).toBe("ltr");
  });
});

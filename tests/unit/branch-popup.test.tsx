import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { BranchPopup } from "@/components/maps/BranchPopup";
import type { BranchSummary } from "@/types/branch";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeBranchSummary, makeLocalizedPromotion } from "./helpers/branch-fixture";

const TODAY_HOURS = { openingTime: "08:00", closingTime: "20:00", openingTime2: null, closingTime2: null };

const BRANCH: BranchSummary = makeBranchSummary({
  id: "jerusalem-ramot",
  displayName: "Maayan 2000 – Ramot",
  city: { id: "jerusalem", slug: "jerusalem", name: "Jerusalem", latitude: 31.77, longitude: 35.21 },
  address: "Ramot Blvd 1",
  latitude: 31.8,
  longitude: 35.2,
  phone: "+972-2-1234567",
  whatsappNumber: "+972501234567",
  status: "OPEN",
  todayHours: TODAY_HOURS,
  distanceMeters: 1500,
  statusViewModel: {
    status: "OPEN",
    dayOfWeek: 0,
    todayHours: TODAY_HOURS,
    isSpecialDay: false,
    specialDayTitle: null,
    minutesUntilChange: 120,
    closingTime: "20:00",
    nextOpening: null,
  },
});

describe("BranchPopup", () => {
  it("affiche nom, ville/adresse et statut du jour — variante panel (desktop, §10)", () => {
    renderWithIntl(
      <BranchPopup branch={BRANCH} locale="en" variant="panel" onClose={vi.fn()} onViewDetails={vi.fn()} />
    );
    expect(screen.getByText("Maayan 2000 – Ramot")).toBeTruthy();
    expect(screen.getByText(/Jerusalem/)).toBeTruthy();
    expect(screen.getByText("Open now")).toBeTruthy();
  });

  it("expose des liens wa.me/tel réels, pas des boutons désactivés (§10)", () => {
    renderWithIntl(
      <BranchPopup branch={BRANCH} locale="en" variant="panel" onClose={vi.fn()} onViewDetails={vi.fn()} />
    );
    expect(screen.getByRole("link", { name: /WhatsApp/ }).getAttribute("href")).toBe("https://wa.me/972501234567");
    expect(screen.getByRole("link", { name: /Call/ }).getAttribute("href")).toBe("tel:+97221234567");
  });

  it("le bouton détails signale le magasin sélectionné (§9)", () => {
    const onViewDetails = vi.fn();
    renderWithIntl(
      <BranchPopup branch={BRANCH} locale="en" variant="panel" onClose={vi.fn()} onViewDetails={onViewDetails} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Branch details" }));
    expect(onViewDetails).toHaveBeenCalledWith(BRANCH.id);
  });

  it("variante panel (InfoWindow Google) : pas de bouton de fermeture propre — Google fournit déjà le sien (§15)", () => {
    renderWithIntl(
      <BranchPopup branch={BRANCH} locale="en" variant="panel" onClose={vi.fn()} onViewDetails={vi.fn()} />
    );
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("variante sheet (fiche mobile) : bouton de fermeture propre, appelle onClose (§15)", () => {
    const onClose = vi.fn();
    renderWithIntl(
      <BranchPopup branch={BRANCH} locale="en" variant="sheet" onClose={onClose} onViewDetails={vi.fn()} />
    );
    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("traduit intégralement en hébreu (RTL) — aucun texte codé en dur (§10/§14)", () => {
    renderWithIntl(
      <BranchPopup branch={BRANCH} locale="he" variant="sheet" onClose={vi.fn()} onViewDetails={vi.fn()} />,
      "he"
    );
    expect(screen.getByText("פתוח עכשיו")).toBeTruthy();
    expect(screen.getByRole("button", { name: "פרטי הסניף" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "סגירה" })).toBeTruthy();
  });

  it("n'affiche AUCUN aperçu promotion quand featuredPromotion est null — comportement inchangé (Phase 9, §14)", () => {
    renderWithIntl(
      <BranchPopup branch={BRANCH} locale="en" variant="panel" onClose={vi.fn()} onViewDetails={vi.fn()} />
    );
    expect(screen.queryByText(/₪/)).toBeNull();
  });

  it("affiche un aperçu compact de featuredPromotion quand présent, prix inclus (Phase 9, §14)", () => {
    const branchWithPromo: BranchSummary = {
      ...BRANCH,
      featuredPromotion: makeLocalizedPromotion({
        id: "chicken",
        productName: "Fresh chicken",
        price: "29.90",
        currency: "ILS",
        unit: "KG",
        isFeatured: true,
      }),
    };

    renderWithIntl(
      <BranchPopup branch={branchWithPromo} locale="en" variant="panel" onClose={vi.fn()} onViewDetails={vi.fn()} />
    );

    expect(screen.getByText("Fresh chicken")).toBeTruthy();
    expect(screen.getByText(/29\.90/)).toBeTruthy();
  });
});

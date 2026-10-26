import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { BranchActions } from "@/components/branches/BranchActions";
import { BranchStickyActionBar } from "@/components/branches/BranchStickyActionBar";
import * as trackModule from "@/lib/analytics/track";
import type { BranchDetail } from "@/types/branch";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeBranchDetail } from "./helpers/branch-fixture";

const BASE_BRANCH: BranchDetail = makeBranchDetail({
  id: "jerusalem-ramot",
  phone: "+972-2-1234567",
  whatsappNumber: "+972501234567",
  whatsappGroupUrl: null,
});

describe("BranchActions (Phase 8, §7/§17/§36)", () => {
  it("affiche Navigation, Appeler et WhatsApp quand toutes les données sont présentes", () => {
    renderWithIntl(<BranchActions branch={BASE_BRANCH} />);
    expect(screen.getByRole("button", { name: "Directions" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Call/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toBeTruthy();
  });

  it("omet le bouton Appeler quand le magasin n'a pas de téléphone, sans planter (§37)", () => {
    renderWithIntl(<BranchActions branch={{ ...BASE_BRANCH, phone: null }} />);
    expect(screen.queryByRole("link", { name: /Call/ })).toBeNull();
  });

  it("omet le bouton WhatsApp quand ni whatsappNumber ni whatsappGroupUrl ne sont renseignés", () => {
    renderWithIntl(<BranchActions branch={{ ...BASE_BRANCH, whatsappNumber: null, whatsappGroupUrl: null }} />);
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
  });

  it("préfère le lien de groupe WhatsApp au numéro individuel quand les deux sont configurés (§17), un seul bouton", () => {
    renderWithIntl(
      <BranchActions branch={{ ...BASE_BRANCH, whatsappGroupUrl: "https://chat.whatsapp.com/abc123" }} />
    );
    const links = screen.getAllByRole("link", { name: /WhatsApp/ });
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://chat.whatsapp.com/abc123");
  });

  it("construit un vrai lien tel: pour Appeler", () => {
    renderWithIntl(<BranchActions branch={BASE_BRANCH} />);
    expect(screen.getByRole("link", { name: /Call/ }).getAttribute("href")).toBe("tel:+97221234567");
  });

  it("émet phone_click/whatsapp_click avec le branchId, jamais de donnée personnelle (§36)", () => {
    const trackSpy = vi.spyOn(trackModule, "track");
    renderWithIntl(<BranchActions branch={BASE_BRANCH} />);

    fireEvent.click(screen.getByRole("link", { name: /Call/ }));
    expect(trackSpy).toHaveBeenCalledWith({ name: "phone_click", branchId: BASE_BRANCH.id });

    fireEvent.click(screen.getByRole("link", { name: /WhatsApp/ }));
    expect(trackSpy).toHaveBeenCalledWith({ name: "whatsapp_click", branchId: BASE_BRANCH.id });
  });
});

describe("BranchStickyActionBar (Phase 8, §7 — barre sticky mobile)", () => {
  it("réutilise BranchActions telle quelle, jamais une seconde implémentation des actions", () => {
    renderWithIntl(<BranchStickyActionBar branch={BASE_BRANCH} />);
    expect(screen.getByRole("button", { name: "Directions" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Call/ })).toBeTruthy();
  });
});

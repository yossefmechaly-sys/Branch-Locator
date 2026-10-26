import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { NavigationMenu } from "@/components/branches/NavigationMenu";
import * as trackModule from "@/lib/analytics/track";
import type { BranchSummary } from "@/types/branch";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeBranchSummary } from "./helpers/branch-fixture";

const BRANCH: BranchSummary = makeBranchSummary({
  id: "jerusalem-ramot",
  displayName: "Maayan 2000 – Ramot",
  city: { id: "jerusalem", slug: "jerusalem", name: "Jerusalem", latitude: 31.77, longitude: 35.21 },
  address: "Ramot Blvd 1",
  latitude: 31.8,
  longitude: 35.2,
  phone: "+972-2-1234567",
  whatsappNumber: "+972501234567",
});

const ORIGINAL_USER_AGENT = navigator.userAgent;

function setUserAgent(userAgent: string) {
  Object.defineProperty(navigator, "userAgent", { value: userAgent, configurable: true });
}

afterEach(() => {
  setUserAgent(ORIGINAL_USER_AGENT);
});

describe("NavigationMenu (§9-§12/§23)", () => {
  beforeEach(() => {
    setUserAgent("Mozilla/5.0 (Linux; Android 14)");
  });

  it("propose les trois options avec des URLs réelles construites par les helpers centralisés (§23 : jamais assemblées ici)", () => {
    renderWithIntl(<NavigationMenu branch={BRANCH} />);

    fireEvent.click(screen.getByRole("button", { name: "Directions" }));

    expect(screen.getByRole("link", { name: "Waze" }).getAttribute("href")).toBe(
      "https://waze.com/ul?ll=31.8,35.2&navigate=yes"
    );
    expect(screen.getByRole("link", { name: "Google Maps" }).getAttribute("href")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=31.8%2C35.2"
    );
    expect(screen.getByRole("link", { name: "Apple Maps" }).getAttribute("href")).toBe(
      "https://maps.apple.com/?daddr=31.8%2C35.2&dirflg=d"
    );
  });

  it("priorise Apple Maps en tête sur un appareil Apple détecté, sans jamais retirer les autres options (§12, non critique)", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    renderWithIntl(<NavigationMenu branch={BRANCH} />);

    fireEvent.click(screen.getByRole("button", { name: "Directions" }));

    const links = screen.getAllByRole("link").map((link) => link.textContent);
    expect(links[0]).toBe("Apple Maps");
    expect(links).toHaveLength(3);
  });

  it("émet l'événement analytics correspondant au clic, avec branchId mais sans coordonnées (§22)", () => {
    const trackSpy = vi.spyOn(trackModule, "track");
    renderWithIntl(<NavigationMenu branch={BRANCH} />);

    fireEvent.click(screen.getByRole("button", { name: "Directions" }));
    fireEvent.click(screen.getByRole("link", { name: "Waze" }));

    expect(trackSpy).toHaveBeenCalledWith({ name: "waze_click", branchId: BRANCH.id });
    const [[payload]] = trackSpy.mock.calls;
    expect(payload).not.toHaveProperty("lat");
    expect(payload).not.toHaveProperty("lng");
    expect(payload).not.toHaveProperty("coordinates");
  });

  it("traduit intégralement en hébreu (RTL) — aucun texte codé en dur (§14)", () => {
    renderWithIntl(<NavigationMenu branch={BRANCH} />, "he");

    fireEvent.click(screen.getByRole("button", { name: "ניווט" }));
    expect(screen.getByText("בחירת אפליקציית ניווט")).toBeTruthy();
  });
});

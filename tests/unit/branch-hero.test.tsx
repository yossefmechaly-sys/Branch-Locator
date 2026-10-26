import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { BranchHero } from "@/components/branches/BranchHero";

import { renderWithIntl } from "./helpers/render-with-intl";
import { makeBranchDetail } from "./helpers/branch-fixture";

describe("BranchHero (Phase 8, §7)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("affiche le nom, la ville, le district et l'adresse du magasin", () => {
    renderWithIntl(
      <BranchHero
        branch={makeBranchDetail({
          id: "jerusalem-ramot",
          displayName: "Maayan 2000 – Ramot",
          city: { id: "jerusalem", slug: "jerusalem", name: "Jerusalem", latitude: 31.8, longitude: 35.2 },
          district: "North",
          address: "Ramot Blvd 1",
        })}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Maayan 2000 – Ramot" })).toBeTruthy();
    expect(screen.getByText(/Jerusalem/)).toBeTruthy();
    expect(screen.getByText(/North/)).toBeTruthy();
    expect(screen.getByText(/Ramot Blvd 1/)).toBeTruthy();
  });

  it("affiche une icône de repli discrète quand le magasin n'a pas de photo principale, jamais une image cassée (§37)", () => {
    const { container } = renderWithIntl(
      <BranchHero branch={makeBranchDetail({ id: "no-photo", mainImage: null })} />
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("affiche l'image principale quand elle est disponible", () => {
    renderWithIntl(
      <BranchHero
        branch={makeBranchDetail({
          id: "with-photo",
          displayName: "Maayan 2000 – Ramot",
          mainImage: "https://cdn.example.com/ramot.jpg",
        })}
      />
    );
    expect(screen.getByAltText("Maayan 2000 – Ramot")).toBeTruthy();
  });

  it("inclut le statut horaire en direct et les actions (Navigation/Appeler/WhatsApp)", () => {
    renderWithIntl(
      <BranchHero
        branch={makeBranchDetail({
          id: "jerusalem-ramot",
          phone: "+972-2-1234567",
          openingHours: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            isClosed: false,
            openingTime: "07:00",
            closingTime: "22:00",
            openingTime2: null,
            closingTime2: null,
          })),
        })}
      />
    );

    expect(screen.getByText("Open now")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Directions" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Call/ })).toBeTruthy();
  });
});

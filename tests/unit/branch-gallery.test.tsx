import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { BranchGallery } from "@/components/branches/BranchGallery";

import { renderWithIntl } from "./helpers/render-with-intl";

const IMAGES = [
  { imageUrl: "https://cdn.example.com/ramot-1.jpg", alt: "Façade du magasin" },
  { imageUrl: "https://cdn.example.com/ramot-2.jpg", alt: "Rayon fruits et légumes" },
  { imageUrl: "https://cdn.example.com/ramot-3.jpg", alt: null },
];

describe("BranchGallery (Phase 8, §13)", () => {
  it("affiche un état de repli explicite quand le magasin n'a aucune photo, jamais une image cassée", () => {
    renderWithIntl(<BranchGallery images={[]} branchName="Ramot" />);
    expect(screen.getByText("No photo available yet")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("affiche l'image principale en premier, sans rangée de miniatures pour une seule photo", () => {
    renderWithIntl(<BranchGallery images={[IMAGES[0]]} branchName="Ramot" />);
    expect(screen.getByAltText("Façade du magasin")).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("affiche des miniatures cliquables pour plusieurs photos, la première active au chargement", () => {
    renderWithIntl(<BranchGallery images={IMAGES} branchName="Ramot" />);

    const thumbnails = screen.getAllByRole("button");
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0].getAttribute("aria-current")).toBe("true");
    expect(thumbnails[1].getAttribute("aria-current")).toBe("false");

    // L'image principale affichée est bien la première (alt réel de la photo).
    expect(screen.getByAltText("Façade du magasin")).toBeTruthy();
  });

  it("cliquer sur une miniature bascule l'image principale affichée", () => {
    renderWithIntl(<BranchGallery images={IMAGES} branchName="Ramot" />);

    const thumbnails = screen.getAllByRole("button");
    fireEvent.click(thumbnails[1]);

    expect(screen.getByAltText("Rayon fruits et légumes")).toBeTruthy();
    expect(screen.queryByAltText("Façade du magasin")).toBeNull();
    expect(thumbnails[1].getAttribute("aria-current")).toBe("true");
    expect(thumbnails[0].getAttribute("aria-current")).toBe("false");
  });

  it("retombe sur le texte alternatif générique quand une photo n'a pas d'`alt` en base", () => {
    renderWithIntl(<BranchGallery images={IMAGES} branchName="Ramot" />);
    fireEvent.click(screen.getAllByRole("button")[2]);
    expect(screen.getByAltText("Ramot – main photo")).toBeTruthy();
  });
});

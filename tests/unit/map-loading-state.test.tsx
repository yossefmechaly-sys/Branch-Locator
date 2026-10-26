import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { MapLoadingState } from "@/components/maps/MapLoadingState";

import { renderWithIntl } from "./helpers/render-with-intl";

describe("MapLoadingState", () => {
  it("annonce le chargement de façon accessible (§4/§23)", () => {
    renderWithIntl(<MapLoadingState />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText("Loading map…")).toBeTruthy();
  });

  it("traduit le message en russe", () => {
    renderWithIntl(<MapLoadingState />, "ru");
    expect(screen.getByText("Загрузка карты…")).toBeTruthy();
  });
});

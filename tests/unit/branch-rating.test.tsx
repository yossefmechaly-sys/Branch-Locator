import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { BranchCard } from "@/components/branches/BranchCard";
import { BranchRating } from "@/components/branches/BranchRating";
import type { AppLocale } from "@/types/i18n";
import { makeBranchSummary } from "./helpers/branch-fixture";
import { renderWithIntl } from "./helpers/render-with-intl";

describe("Customer ratings in the branch list", () => {
  it.each(["he", "en", "fr", "ru", "es"] as AppLocale[])("shows the average and review count with an accessible link in %s", (locale) => {
    renderWithIntl(<BranchRating slug="ramot" locale={locale} rating={{ total: 12, averageRating: 4.5 }} />, locale);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(`/${locale}/branches/ramot#reviews`);
    expect(link.getAttribute("aria-label")).toContain(new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(4.5));
    expect(link.getAttribute("aria-label")).toContain("12");
    expect(link.textContent).toContain("12");
    expect(link.textContent).not.toContain("reviews.");
  });

  it("does not present a branch without published reviews as a zero-star rating", () => {
    renderWithIntl(<BranchRating slug="ramot" locale="fr" rating={{ total: 0, averageRating: null }} />, "fr");
    expect(screen.getByRole("link", { name: "Pas encore d’avis" }).getAttribute("href")).toBe("/fr/branches/ramot#reviews");
    expect(screen.queryByText(/\/ 5/)).toBeNull();
  });

  it("displays the rating on the actual branch card and links to that branch's reviews", () => {
    const branch = makeBranchSummary({ id: "ramot", reviewRating: { total: 1, averageRating: 1 } });
    renderWithIntl(<BranchCard branch={branch} locale="en" isSelected={false} onSelect={() => {}} />);
    expect(screen.getByRole("link", { name: "Average rating 1.0 out of 5, 1 review" }).getAttribute("href")).toBe("/en/branches/ramot#reviews");
  });
});

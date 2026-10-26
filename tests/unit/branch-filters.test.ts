import { describe, expect, it } from "vitest";

import {
  applyBranchFilters,
  defaultBranchFilterState,
  hasActiveBranchFilters,
  type FilterableBranch,
} from "@/lib/filters/branch-filters";

const branches: (FilterableBranch & { id: string })[] = [
  { id: "jerusalem-ramot", citySlug: "jerusalem", serviceSlugs: ["parking", "delivery"], isOpenNow: true },
  { id: "jerusalem-katamon", citySlug: "jerusalem", serviceSlugs: ["accessibility"], isOpenNow: false },
  { id: "netanya", citySlug: "netanya", serviceSlugs: ["parking", "bakery"], isOpenNow: true },
];

describe("applyBranchFilters", () => {
  it("ne filtre rien avec l'état par défaut", () => {
    expect(applyBranchFilters(branches, defaultBranchFilterState)).toHaveLength(3);
  });

  it("filtre par ville", () => {
    const result = applyBranchFilters(branches, { ...defaultBranchFilterState, citySlug: "jerusalem" });
    expect(result.map((b) => b.id)).toEqual(["jerusalem-ramot", "jerusalem-katamon"]);
  });

  it("filtre par service", () => {
    const result = applyBranchFilters(branches, { ...defaultBranchFilterState, serviceSlug: "parking" });
    expect(result.map((b) => b.id)).toEqual(["jerusalem-ramot", "netanya"]);
  });

  it("filtre par « ouvert maintenant »", () => {
    const result = applyBranchFilters(branches, { ...defaultBranchFilterState, isOpenNow: true });
    expect(result.map((b) => b.id)).toEqual(["jerusalem-ramot", "netanya"]);
  });

  it("combine plusieurs filtres (ET logique)", () => {
    const result = applyBranchFilters(branches, { citySlug: "jerusalem", serviceSlug: "parking", isOpenNow: true });
    expect(result.map((b) => b.id)).toEqual(["jerusalem-ramot"]);
  });

  it("peut renvoyer une liste vide si aucun magasin ne correspond", () => {
    const result = applyBranchFilters(branches, { ...defaultBranchFilterState, citySlug: "ashdod" });
    expect(result).toHaveLength(0);
  });
});

describe("hasActiveBranchFilters", () => {
  it("est faux pour l'état par défaut", () => {
    expect(hasActiveBranchFilters(defaultBranchFilterState)).toBe(false);
  });

  it("est vrai dès qu'un filtre est actif", () => {
    expect(hasActiveBranchFilters({ ...defaultBranchFilterState, isOpenNow: true })).toBe(true);
    expect(hasActiveBranchFilters({ ...defaultBranchFilterState, citySlug: "jerusalem" })).toBe(true);
  });
});

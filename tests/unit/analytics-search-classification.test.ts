import { describe, expect, it } from "vitest";

import { classifySearch } from "@/lib/analytics/search-classification";

const CITIES = [
  { name: "Jerusalem", slug: "jerusalem" },
  { name: "Netanya", slug: "netanya" },
];

const BRANCHES = [
  { id: "branch-1", displayName: "Maayan 2000 – Ramot" },
  { id: "branch-2", displayName: "Maayan 2000 – Geula" },
];

/**
 * `classifySearch` (Phase 10, §4) — LA garantie testable que la chaîne
 * saisie par l'utilisateur n'apparaît JAMAIS dans la valeur renvoyée : chaque
 * test ci-dessous vérifie la classification ET l'absence de tout champ texte
 * libre dans le résultat.
 */
describe("classifySearch (Phase 10, §4)", () => {
  it("classe 'none' pour une requête vide", () => {
    const result = classifySearch("", CITIES, BRANCHES);
    expect(result).toEqual({ matchType: "none", resultCount: 0, matchedCitySlug: null, matchedBranchId: null });
  });

  it("classe 'none' quand aucun résultat n'est retourné (§14 : zero-result)", () => {
    const result = classifySearch("adresse introuvable", CITIES, []);
    expect(result.matchType).toBe("none");
    expect(result.resultCount).toBe(0);
  });

  it("classe 'city' et renvoie le slug (jamais le texte saisi) quand la requête correspond à une ville", () => {
    const result = classifySearch("Jerusalem", CITIES, BRANCHES);
    expect(result).toEqual({ matchType: "city", resultCount: 2, matchedCitySlug: "jerusalem", matchedBranchId: null });
  });

  it("classe 'city' insensible à la casse", () => {
    const result = classifySearch("JERUSALEM", CITIES, BRANCHES);
    expect(result.matchType).toBe("city");
    expect(result.matchedCitySlug).toBe("jerusalem");
  });

  it("classe 'branch' et renvoie l'id (jamais le nom saisi) quand la requête correspond à un nom de magasin", () => {
    const result = classifySearch("Ramot", CITIES, [BRANCHES[0]]);
    expect(result).toEqual({ matchType: "branch", resultCount: 1, matchedCitySlug: null, matchedBranchId: "branch-1" });
  });

  it("classe 'other' quand des résultats existent sans correspondre à une ville ni à un nom de magasin", () => {
    const result = classifySearch("rehov bar kochva", CITIES, [BRANCHES[0]]);
    expect(result).toEqual({ matchType: "other", resultCount: 1, matchedCitySlug: null, matchedBranchId: null });
  });

  it("priorise 'city' sur 'branch' si la requête correspond aux deux", () => {
    const result = classifySearch("Netanya", [...CITIES], [{ id: "branch-3", displayName: "Netanya Center" }]);
    expect(result.matchType).toBe("city");
  });
});

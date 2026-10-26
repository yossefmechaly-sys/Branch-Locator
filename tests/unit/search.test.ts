import { describe, expect, it } from "vitest";

import { normalizeSearchText } from "@/lib/search/normalize";
import { filterBySearchQuery, matchesSearchQuery } from "@/lib/search/search";

describe("normalizeSearchText", () => {
  it("retire les diacritiques latins et met en minuscules", () => {
    expect(normalizeSearchText("Jérusalem")).toBe("jerusalem");
    expect(normalizeSearchText("Jerusalén")).toBe("jerusalen");
    expect(normalizeSearchText("PETAH TIKVA")).toBe("petah tikva");
  });

  it("laisse l'hébreu et le russe inchangés (hors casse/espaces)", () => {
    expect(normalizeSearchText("ירושלים")).toBe("ירושלים");
    expect(normalizeSearchText("Иерусалим")).toBe("иерусалим");
  });

  it("compresse les espaces multiples et coupe les bords", () => {
    expect(normalizeSearchText("  Bnei   Brak  ")).toBe("bnei brak");
  });
});

describe("matchesSearchQuery / filterBySearchQuery", () => {
  // Simule ce que `services/branch.service.ts#buildSearchTerms()` rassemble pour
  // UN SEUL magasin : les traductions de ville dans les 5 langues + alias — pas
  // seulement la langue d'affichage courante (cahier des charges §6).
  const jerusalemBranchTerms = [
    "JLM-01",
    "רחוב שמעון בר-כוכבא 12",
    "סניף רמות",
    "Ramot Branch",
    "Филиал Рамот",
    "Magasin Ramot",
    "Tienda Ramot",
    "ירושלים",
    "Jerusalem",
    "Иерусалим",
    "Jérusalem",
    "Jerusalén",
  ];

  const netanyaBranchTerms = ["NTY-01", "רחוב הרצל 3", "סניף נתניה", "Netanya Branch", "נתניה", "Netanya"];

  const records = [
    { id: "jerusalem-ramot", searchTerms: jerusalemBranchTerms },
    { id: "netanya", searchTerms: netanyaBranchTerms },
  ];

  it.each([
    ["ירושלים", "hébreu"],
    ["Jerusalem", "anglais"],
    ["Иерусалим", "russe"],
    ["Jérusalem", "français (avec accent)"],
    ["jerusalem", "français (sans accent, ce que tape réellement un clavier fr)"],
    ["Jerusalén", "espagnol"],
  ])("« %s » (%s) retourne le magasin de Jérusalem quelle que soit la langue de la requête", (query) => {
    expect(matchesSearchQuery(jerusalemBranchTerms, query)).toBe(true);
    expect(matchesSearchQuery(netanyaBranchTerms, query)).toBe(false);

    const results = filterBySearchQuery(records, query);
    expect(results.map((r) => r.id)).toEqual(["jerusalem-ramot"]);
  });

  it("supporte une recherche partielle (préfixe)", () => {
    expect(matchesSearchQuery(jerusalemBranchTerms, "Jer")).toBe(true);
    expect(matchesSearchQuery(jerusalemBranchTerms, "כוכבא")).toBe(true);
  });

  it("une requête vide renvoie tous les enregistrements, sans filtrage", () => {
    expect(filterBySearchQuery(records, "")).toHaveLength(2);
    expect(filterBySearchQuery(records, "   ")).toHaveLength(2);
  });

  it("une requête sans correspondance renvoie une liste vide", () => {
    expect(filterBySearchQuery(records, "Tel Aviv")).toHaveLength(0);
  });
});

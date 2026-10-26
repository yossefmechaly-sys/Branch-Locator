import { describe, expect, it } from "vitest";

import { applyUserDistance, formatDistanceMeters, haversineDistanceMeters } from "@/lib/geolocation/distance";
import { applyBranchFilters, type FilterableBranch } from "@/lib/filters/branch-filters";
import type { BranchSummary } from "@/types/branch";

import { makeBranchSummary as makeBranch } from "./helpers/branch-fixture";

describe("haversineDistanceMeters (§3/§24)", () => {
  it("retourne 0 pour deux points identiques", () => {
    expect(haversineDistanceMeters({ lat: 31.77, lng: 35.21 }, { lat: 31.77, lng: 35.21 })).toBe(0);
  });

  it("calcule une distance connue (Jérusalem → Tel Aviv, ≈ 54 km à vol d'oiseau)", () => {
    const jerusalem = { lat: 31.7683, lng: 35.2137 };
    const telAviv = { lat: 32.0853, lng: 34.7818 };
    const distance = haversineDistanceMeters(jerusalem, telAviv);
    expect(distance).toBeGreaterThan(50_000);
    expect(distance).toBeLessThan(60_000);
  });

  it("est symétrique (a→b === b→a)", () => {
    const a = { lat: 31.8, lng: 35.2 };
    const b = { lat: 32.08, lng: 34.78 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(haversineDistanceMeters(b, a), 6);
  });
});

describe("formatDistanceMeters (§3)", () => {
  it("formate en mètres sous 1 km", () => {
    expect(formatDistanceMeters(850, "en")).toMatch(/850/);
    expect(formatDistanceMeters(850, "en")).toMatch(/m/);
  });

  it("formate en kilomètres au-delà de 1 km", () => {
    const formatted = formatDistanceMeters(2400, "en");
    expect(formatted).toMatch(/2\.4/);
    expect(formatted).toMatch(/km/);
  });

  it("respecte la locale demandée (hébreu)", () => {
    const formatted = formatDistanceMeters(500, "he");
    expect(formatted).toMatch(/500/);
  });
});

describe("applyUserDistance (§4)", () => {
  const near = makeBranch({ id: "near", latitude: 31.79, longitude: 35.21 });
  const far = makeBranch({ id: "far", latitude: 32.08, longitude: 34.78 });
  const middle = makeBranch({ id: "middle", latitude: 31.9, longitude: 35.0 });
  const userLocation = { lat: 31.7683, lng: 35.2137 };

  it("retourne les magasins inchangés (distanceMeters=null) quand userLocation est null", () => {
    const result = applyUserDistance([far, near, middle], null);
    expect(result).toEqual([far, near, middle]);
    expect(result.every((b) => b.distanceMeters === null)).toBe(true);
  });

  it("annote chaque magasin avec sa distance et trie par proximité croissante", () => {
    const result = applyUserDistance([far, near, middle], userLocation);
    expect(result.map((b) => b.id)).toEqual(["near", "middle", "far"]);
    expect(result[0].distanceMeters).not.toBeNull();
    expect(result[0].distanceMeters!).toBeLessThan(result[1].distanceMeters!);
    expect(result[1].distanceMeters!).toBeLessThan(result[2].distanceMeters!);
  });

  it("ne perd aucun magasin lors du tri", () => {
    const result = applyUserDistance([far, near, middle], userLocation);
    expect(result).toHaveLength(3);
  });

  it("se combine avec les filtres existants sans perdre de résultats (§4 : recherche + filtres + tri distance ensemble)", () => {
    const openOnly: (FilterableBranch & { branch: BranchSummary })[] = [
      { branch: near, citySlug: "city", serviceSlugs: [], isOpenNow: true },
      { branch: far, citySlug: "city", serviceSlugs: [], isOpenNow: false },
      { branch: middle, citySlug: "city", serviceSlugs: [], isOpenNow: true },
    ];

    const filtered = applyBranchFilters(openOnly, {
      citySlug: null,
      serviceSlug: null,
      isOpenNow: true,
    }).map((entry) => entry.branch);

    // Le filtre "ouvert maintenant" retire `far` — le tri par distance ne
    // doit ensuite porter que sur ce sous-ensemble déjà filtré, sans le
    // réintroduire ni perdre `near`/`middle`.
    expect(filtered.map((b) => b.id).sort()).toEqual(["middle", "near"]);

    const sorted = applyUserDistance(filtered, userLocation);
    expect(sorted.map((b) => b.id)).toEqual(["near", "middle"]);
  });
});

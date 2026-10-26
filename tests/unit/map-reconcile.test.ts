import { describe, expect, it } from "vitest";

import { diffMarkerIds } from "@/lib/maps/reconcile";

describe("diffMarkerIds — filtrage des marqueurs (§12/§13)", () => {
  it("ajoute tout au premier rendu (aucun marqueur existant)", () => {
    const { toAdd, toRemove } = diffMarkerIds([], ["a", "b", "c"]);
    expect(toAdd).toEqual(["a", "b", "c"]);
    expect(toRemove).toEqual([]);
  });

  it("ne touche à rien si le résultat filtré est identique (aucun recalcul superflu — §22)", () => {
    const { toAdd, toRemove } = diffMarkerIds(["a", "b"], ["a", "b"]);
    expect(toAdd).toEqual([]);
    expect(toRemove).toEqual([]);
  });

  it("retire les magasins exclus par la recherche/un filtre (ex. 12 → 3 résultats)", () => {
    const existing = ["jerusalem-1", "jerusalem-2", "tel-aviv-1", "netanya-1"];
    const { toAdd, toRemove } = diffMarkerIds(existing, ["jerusalem-1", "jerusalem-2"]);
    expect(toAdd).toEqual([]);
    expect(toRemove.sort()).toEqual(["netanya-1", "tel-aviv-1"]);
  });

  it("ajoute les nouveaux magasins qui entrent dans le résultat filtré sans toucher aux autres", () => {
    const { toAdd, toRemove } = diffMarkerIds(["a"], ["a", "b"]);
    expect(toAdd).toEqual(["b"]);
    expect(toRemove).toEqual([]);
  });

  it("gère simultanément ajouts et retraits (changement de filtre de ville)", () => {
    const { toAdd, toRemove } = diffMarkerIds(["jerusalem-1", "jerusalem-2"], ["jerusalem-1", "netanya-1"]);
    expect(toAdd).toEqual(["netanya-1"]);
    expect(toRemove).toEqual(["jerusalem-2"]);
  });

  it("peut vider entièrement la carte (recherche sans résultat)", () => {
    const { toAdd, toRemove } = diffMarkerIds(["a", "b"], []);
    expect(toAdd).toEqual([]);
    expect(toRemove.sort()).toEqual(["a", "b"]);
  });
});

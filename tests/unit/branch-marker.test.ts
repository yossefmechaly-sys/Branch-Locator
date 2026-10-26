import { describe, expect, it } from "vitest";

import { createBranchMarker, createUserLocationMarker, setBranchMarkerState } from "@/components/maps/BranchMarker";
import { createFakeMaps, FakeMarker } from "./helpers/fake-google-maps";

const BRANCH = {
  id: "jerusalem-ramot",
  position: { lat: 31.8, lng: 35.2 },
  status: "OPEN" as const,
  title: "Maayan 2000 – Ramot",
};

describe("createBranchMarker", () => {
  it("crée un marqueur positionné sur le magasin, avec son nom en title natif (§6/§23)", () => {
    const maps = createFakeMaps();
    const clicks: string[] = [];

    const marker = createBranchMarker({
      maps,
      map: {} as google.maps.Map,
      branch: BRANCH,
      onClick: (id) => clicks.push(id),
      onMouseOver: () => {},
      onMouseOut: () => {},
    }) as unknown as FakeMarker;

    expect(marker.options.position).toEqual(BRANCH.position);
    expect(marker.options.title).toBe(BRANCH.title);
    expect(marker.options.icon).toBeDefined();
  });

  it("appelle onClick/onMouseOver/onMouseOut avec l'identifiant du magasin (§8/§9 : la carte ne connaît que l'id, jamais l'inverse)", () => {
    const maps = createFakeMaps();
    const clicked: string[] = [];
    const hoveredIn: string[] = [];
    const hoveredOut: string[] = [];

    const marker = createBranchMarker({
      maps,
      map: {} as google.maps.Map,
      branch: BRANCH,
      onClick: (id) => clicked.push(id),
      onMouseOver: (id) => hoveredIn.push(id),
      onMouseOut: (id) => hoveredOut.push(id),
    }) as unknown as FakeMarker;

    marker.trigger("click");
    marker.trigger("mouseover");
    marker.trigger("mouseout");

    expect(clicked).toEqual([BRANCH.id]);
    expect(hoveredIn).toEqual([BRANCH.id]);
    expect(hoveredOut).toEqual([BRANCH.id]);
  });

  it("place le marqueur sélectionné au-dessus des autres (zIndex) — un magasin par défaut ne l'est pas", () => {
    const maps = createFakeMaps();
    const selected = createBranchMarker({
      maps,
      map: {} as google.maps.Map,
      branch: BRANCH,
      initialState: "selected",
      onClick: () => {},
      onMouseOver: () => {},
      onMouseOut: () => {},
    }) as unknown as FakeMarker;
    const defaultMarker = createBranchMarker({
      maps,
      map: {} as google.maps.Map,
      branch: { ...BRANCH, id: "netanya" },
      onClick: () => {},
      onMouseOver: () => {},
      onMouseOut: () => {},
    }) as unknown as FakeMarker;

    expect(selected.options.zIndex).toBe(999);
    expect(defaultMarker.options.zIndex).toBeUndefined();
  });
});

describe("setBranchMarkerState", () => {
  it("change l'icône et le zIndex d'un marqueur EXISTANT — jamais de recréation (§22)", () => {
    const maps = createFakeMaps();
    const marker = createBranchMarker({
      maps,
      map: {} as google.maps.Map,
      branch: BRANCH,
      onClick: () => {},
      onMouseOver: () => {},
      onMouseOut: () => {},
    }) as unknown as FakeMarker;
    const initialIcon = marker.options.icon;

    setBranchMarkerState(marker as unknown as google.maps.Marker, maps, "CLOSED", "selected");

    expect(marker.options.icon).not.toBe(initialIcon);
    expect(marker.options.zIndex).toBe(999);
    expect(FakeMarker.instances).toHaveLength(1); // aucun second marqueur créé
  });

  it("retire le zIndex de mise en avant quand le magasin redevient l'état par défaut", () => {
    const maps = createFakeMaps();
    const marker = createBranchMarker({
      maps,
      map: {} as google.maps.Map,
      branch: BRANCH,
      initialState: "selected",
      onClick: () => {},
      onMouseOver: () => {},
      onMouseOut: () => {},
    }) as unknown as FakeMarker;

    setBranchMarkerState(marker as unknown as google.maps.Marker, maps, "OPEN", "default");

    expect(marker.options.zIndex).toBeUndefined();
  });
});

describe("createUserLocationMarker (Phase 6, §5)", () => {
  it("crée un marqueur non cliquable, positionné sur l'utilisateur, avec une icône distincte des magasins", () => {
    const maps = createFakeMaps();
    const position = { lat: 31.79, lng: 35.22 };

    const storeMarker = createBranchMarker({
      maps,
      map: {} as google.maps.Map,
      branch: BRANCH,
      onClick: () => {},
      onMouseOver: () => {},
      onMouseOut: () => {},
    }) as unknown as FakeMarker;

    const userMarker = createUserLocationMarker(
      maps,
      {} as google.maps.Map,
      position
    ) as unknown as FakeMarker;

    expect(userMarker.options.position).toEqual(position);
    expect(userMarker.options.clickable).toBe(false);
    // Icône visuellement distincte de celle d'un marqueur magasin (§5 : ne
    // jamais laisser croire qu'il s'agit d'un magasin Maayan 2000).
    expect(userMarker.options.icon).not.toEqual(storeMarker.options.icon);
  });

  it("place le marqueur utilisateur au-dessus de tous les marqueurs magasin (zIndex)", () => {
    const maps = createFakeMaps();
    const userMarker = createUserLocationMarker(
      maps,
      {} as google.maps.Map,
      { lat: 31.79, lng: 35.22 }
    ) as unknown as FakeMarker;

    expect(userMarker.options.zIndex).toBe(1000);
  });
});

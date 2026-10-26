import { afterEach, describe, expect, it } from "vitest";

import { buildClusterRenderer, createBranchCluster } from "@/components/maps/BranchCluster";
import { createFakeMaps, FakeMarker } from "./helpers/fake-google-maps";

describe("createBranchCluster — résilience (§18)", () => {
  afterEach(() => {
    // @ts-expect-error -- nettoyage entre tests.
    delete window.google;
  });

  it("se replie silencieusement sur des marqueurs individuels si le clustering ne peut pas s'initialiser", () => {
    // `MarkerClusterer` s'appuie sur le VRAI global `google.maps.OverlayView`
    // (pas sur le `maps` injecté) pour étendre son prototype — absent ici, sa
    // construction échoue : exactement le scénario que ce module doit
    // absorber sans faire tomber le Store Locator.
    // @ts-expect-error -- délibérément absent pour ce test.
    delete window.google;

    const maps = createFakeMaps();
    const handle = createBranchCluster({ maps, map: {} as google.maps.Map, markers: [], locale: "en" });

    expect(() => handle.setMarkers([])).not.toThrow();
    expect(() => handle.destroy()).not.toThrow();
  });
});

describe("buildClusterRenderer", () => {
  function renderCluster(count: number, locale: string, formatTitle?: (count: number) => string) {
    const maps = createFakeMaps();
    const renderer = buildClusterRenderer(maps, locale, formatTitle);
    const fakeCluster = { count, position: { lat: 31.8, lng: 35.2 } } as unknown as Parameters<
      typeof renderer.render
    >[0];
    const marker = renderer.render(fakeCluster, {} as never, {} as google.maps.Map) as unknown as FakeMarker;
    return marker;
  }

  it("affiche le nombre de magasins du groupe, formaté selon la locale (§11)", () => {
    const marker = renderCluster(1234, "en");
    expect((marker.options.label as { text: string }).text).toBe("1,234");
  });

  it("formate le nombre selon les conventions de la locale active (ex. russe)", () => {
    const marker = renderCluster(4, "ru");
    expect((marker.options.label as { text: string }).text).toBe(new Intl.NumberFormat("ru").format(4));
  });

  it("utilise le texte accessible fourni par l'appelant plutôt que le chiffre nu quand disponible (§11/§14)", () => {
    const marker = renderCluster(3, "en", (count) => `${count} branches`);
    expect(marker.options.title).toBe("3 branches");
  });

  it("se rabat sur le nombre seul si aucun texte accessible n'est fourni", () => {
    const marker = renderCluster(5, "en");
    expect(marker.options.title).toBe("5");
  });

  it("place le marqueur de groupe au-dessus des marqueurs individuels", () => {
    const marker = renderCluster(7, "en");
    expect(marker.options.zIndex).toBeGreaterThan(500);
  });
});

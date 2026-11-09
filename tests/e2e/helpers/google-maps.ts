import type { Page } from "@playwright/test";

/** Replace only the Maps SDK; selection, React popups and navigation stay real. */
export async function installGoogleMapsStub(page: Page) {
  await page.addInitScript(() => {
    class TestMap {
      zoom = 7;
      constructor(public element: HTMLElement) {}
      fitBounds() {}
      getZoom() { return this.zoom; }
      setZoom(zoom: number) { this.zoom = zoom; this.element.dataset.mapZoom = String(zoom); }
      setCenter() {}
      panTo(coordinates: unknown) { this.element.dataset.mapCenter = JSON.stringify(coordinates); }
      panBy() {}
    }
    class TestMarker {
      button: HTMLButtonElement;
      constructor(options: { map?: TestMap; title?: string; clickable?: boolean }) {
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.textContent = options.title ?? "";
        this.button.setAttribute("aria-label", `Map marker: ${options.title}`);
        if (options.clickable !== false) options.map?.element.append(this.button);
      }
      addListener(name: string, callback: () => void) {
        this.button.addEventListener(name, callback);
        return { remove: () => this.button.removeEventListener(name, callback) };
      }
      setIcon() {}
      setZIndex() {}
      setPosition() {}
      setMap(map: TestMap | null) {
        if (map) map.element.append(this.button);
        else this.button.remove();
      }
    }
    class TestInfoWindow {
      content?: HTMLElement;
      setContent(content: HTMLElement) { this.content = content; }
      open({ map }: { map: TestMap }) {
        if (!this.content) return;
        this.content.dataset.testid = "map-info-window";
        map.element.append(this.content);
      }
      close() { this.content?.remove(); }
    }
    window.google = {
      maps: {
        Map: TestMap, Marker: TestMarker, InfoWindow: TestInfoWindow,
        LatLngBounds: class {}, Size: class {}, Point: class {},
        event: {
          addListener: () => ({ remove() {} }),
          addListenerOnce: (_target: unknown, _event: string, callback: () => void) => {
            queueMicrotask(callback);
            return { remove() {} };
          },
          clearInstanceListeners() {},
        },
      },
    } as unknown as typeof google;
  });
}

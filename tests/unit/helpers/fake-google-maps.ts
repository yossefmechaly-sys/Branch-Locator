/**
 * Faux `google.maps` minimal pour les tests unitaires de `BranchMarker.ts` /
 * `BranchCluster.ts` — capture ce qui est passé aux constructeurs plutôt que
 * de reproduire un vrai rendu de carte (§24 : mocker Google Maps quand utile,
 * jamais dépendre du réseau réel).
 *
 * Volontairement PAS un mock de `google.maps.Map`/`OverlayView` complet : les
 * tests qui ont besoin de ces objets (marqueurs) reçoivent ce faux `maps`,
 * ceux qui testent le repli de `BranchCluster` en cas d'échec d'initialisation
 * s'appuient au contraire sur son incomplétude (`OverlayView` absent fait
 * échouer `MarkerClusterer` — comportement réel de la bibliothèque, pas une
 * assertion sur ses internes).
 */
export interface FakeMarkerCall {
  options: Record<string, unknown>;
  listeners: Record<string, () => void>;
}

export class FakeMarker {
  static instances: FakeMarker[] = [];
  options: Record<string, unknown>;
  private listeners: Record<string, () => void> = {};
  private currentMap: unknown;

  constructor(options: Record<string, unknown>) {
    this.options = { ...options };
    this.currentMap = options.map;
    FakeMarker.instances.push(this);
  }

  addListener(event: string, handler: () => void) {
    this.listeners[event] = handler;
    return { remove: () => delete this.listeners[event] };
  }

  trigger(event: string) {
    this.listeners[event]?.();
  }

  setIcon(icon: unknown) {
    this.options.icon = icon;
  }

  setZIndex(zIndex: number | undefined) {
    this.options.zIndex = zIndex;
  }

  setMap(map: unknown) {
    this.currentMap = map;
    this.options.map = map;
  }

  getMap() {
    return this.currentMap;
  }
}

export function createFakeMaps() {
  FakeMarker.instances = [];
  return {
    Marker: FakeMarker,
    Size: class Size {
      constructor(
        public width: number,
        public height: number
      ) {}
    },
    Point: class Point {
      constructor(
        public x: number,
        public y: number
      ) {}
    },
    event: {
      clearInstanceListeners: () => {
        /* pas de véritable registre d'événements côté faux marqueur individuel — suffisant pour ces tests */
      },
    },
  } as unknown as typeof google.maps;
}

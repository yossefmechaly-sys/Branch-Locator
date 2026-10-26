import { MarkerClusterer, type Cluster, type Renderer } from "@googlemaps/markerclusterer";

import { buildClusterIconSpec } from "@/lib/maps/icon";
import { toGoogleIcon } from "@/lib/maps/providers/google/icon";

/**
 * Regroupement (clustering) des marqueurs — utile uniquement quand beaucoup de
 * magasins se chevauchent à l'écran (§11 : « n'affiche pas 20 marqueurs
 * superposés »). Comme `BranchMarker.ts`, ce module est impératif par nature
 * (l'API de la bibliothèque ne s'exprime pas en JSX) ; `BranchMap.tsx`
 * l'appelle depuis un `useEffect`, jamais directement au rendu.
 *
 * Résilience (§18) : si `MarkerClusterer` échoue à l'initialisation (bug de la
 * bibliothèque, incompatibilité de version du SDK Google chargé, etc.), on ne
 * laisse jamais l'exception remonter jusqu'à faire planter le Store Locator —
 * on renvoie un handle inoffensif. Les marqueurs individuels, créés par
 * `createBranchMarker` avec leur propre `map`, restent alors visibles
 * séparément (non groupés) : dégradation silencieuse, jamais un écran cassé.
 */
export interface CreateBranchClusterOptions {
  maps: typeof google.maps;
  map: google.maps.Map;
  markers: google.maps.Marker[];
  /** Locale active — formate uniquement le nombre affiché sur chaque groupe
   * (§11 : cohérence RTL/LTR quand du texte — ici des chiffres — est présent). */
  locale: string;
  /** Texte accessible complet (ex. « 4 magasins »), traduit via next-intl côté
   * appelant — ce module n'a pas accès à `useTranslations` (hors React). Par
   * défaut, se rabat sur le nombre seul si non fourni. */
  formatTitle?: (count: number) => string;
  onClusterClick?: (event: google.maps.MapMouseEvent, position: google.maps.LatLng) => void;
}

export interface BranchClusterHandle {
  /** Remplace l'ensemble des marqueurs groupés (pattern recommandé par la
   * bibliothèque : vider puis réajouter, un seul recalcul — §22). */
  setMarkers: (markers: google.maps.Marker[]) => void;
  /** Détache le clusterer de la carte ; ne touche pas aux marqueurs
   * individuels, gérés par `BranchMarker.ts`. */
  destroy: () => void;
}

const NOOP_HANDLE: BranchClusterHandle = {
  setMarkers: () => {
    /* clustering indisponible — les marqueurs restent affichés individuellement */
  },
  destroy: () => {
    /* rien à détacher */
  },
};

/** Exporté pour être testable indépendamment de `MarkerClusterer`/
 * `OverlayViewSafe` (qui exigent un vrai `google.maps.OverlayView` global,
 * non disponible en environnement de test — §24). */
export function buildClusterRenderer(maps: typeof google.maps, locale: string, formatTitle?: (count: number) => string): Renderer {
  const numberFormat = new Intl.NumberFormat(locale);

  return {
    render(cluster: Cluster, _stats, map: google.maps.Map) {
      const count = cluster.count;
      const label = numberFormat.format(count);

      return new maps.Marker({
        position: cluster.position,
        map,
        icon: toGoogleIcon(buildClusterIconSpec(count), maps),
        label: {
          text: label,
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "600",
        },
        title: formatTitle ? formatTitle(count) : label,
        // Toujours au-dessus des marqueurs individuels (§6/§22 — même logique
        // d'ordre d'empilement que la sélection d'un magasin).
        zIndex: 500 + count,
        optimized: false,
      });
    },
  };
}

export function createBranchCluster({
  maps,
  map,
  markers,
  locale,
  formatTitle,
  onClusterClick,
}: CreateBranchClusterOptions): BranchClusterHandle {
  try {
    const clusterer = new MarkerClusterer({
      map,
      markers,
      renderer: buildClusterRenderer(maps, locale, formatTitle),
      onClusterClick: onClusterClick
        ? (event, cluster) => onClusterClick(event, cluster.position)
        : undefined,
    });

    return {
      setMarkers(nextMarkers) {
        try {
          clusterer.clearMarkers(true);
          clusterer.addMarkers(nextMarkers, true);
          clusterer.render();
        } catch {
          // Dégradation silencieuse (§18) — les marqueurs déjà posés sur la
          // carte (via leur propre `map`) restent visibles individuellement.
        }
      },
      destroy() {
        try {
          clusterer.setMap(null);
        } catch {
          // idem — jamais de plantage au démontage.
        }
      },
    };
  } catch {
    return NOOP_HANDLE;
  }
}

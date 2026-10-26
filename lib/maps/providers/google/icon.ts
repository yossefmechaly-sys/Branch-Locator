import type { MarkerIconSpec } from "@/lib/maps/icon";

/**
 * Seul endroit où `MarkerIconSpec` (agnostique) devient un `google.maps.Icon`
 * réel (§21) — `size`/`anchor` doivent être de véritables instances
 * `google.maps.Size`/`Point`, pas de simples objets `{width, height}`.
 */
export function toGoogleIcon(spec: MarkerIconSpec, maps: typeof google.maps): google.maps.Icon {
  return {
    url: spec.url,
    scaledSize: new maps.Size(spec.width, spec.height),
    anchor: new maps.Point(spec.anchorX, spec.anchorY),
  };
}

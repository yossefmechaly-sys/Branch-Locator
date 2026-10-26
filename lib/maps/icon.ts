import type { BranchStatus } from "@/types/opening-hours";

/**
 * Spécification d'icône de marqueur, agnostique du fournisseur (§21). L'URL est
 * un SVG encodé en `data:` — n'importe quel fournisseur cartographique sait
 * afficher une image à une position donnée, donc cette forme n'a rien de
 * spécifique à Google. Seule la conversion vers `google.maps.Icon`
 * (`providers/google/icon.ts`) connaît le type `google.maps.Size`/`Point`.
 */
export interface MarkerIconSpec {
  url: string;
  width: number;
  height: number;
  /** Point d'ancrage (généralement le centre, ce marqueur étant un simple disque). */
  anchorX: number;
  anchorY: number;
}

export type MarkerVisualState = "default" | "hover" | "selected";

/**
 * Couleur par statut — réutilise le même code couleur que `BranchStatus`
 * (badges de la Phase 4) pour que la carte et la liste racontent la même
 * histoire visuelle. Disque simple plutôt qu'un pin illustré détaillé : lisible
 * à petite taille, bon marché à générer/faire varier (§7 — pas de design
 * complexe au détriment des performances), et facilement remplaçable plus tard
 * (changer cette seule fonction suffit à changer l'icône partout sur la carte).
 */
const STATUS_COLORS: Record<BranchStatus, string> = {
  OPEN: "#16a34a",
  OPENING_SOON: "#d97706",
  CLOSING_SOON: "#d97706",
  CLOSED: "#6b7280",
  TEMPORARILY_CLOSED: "#dc2626",
};

export function getBranchStatusColor(status: BranchStatus): string {
  return STATUS_COLORS[status];
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Marqueur de magasin : disque coloré par statut, anneau sombre distinctif à
 * l'état `selected` (même langage visuel que la sélection de `BranchCard` —
 * `border-primary ring-primary`). */
export function buildBranchMarkerIconSpec(status: BranchStatus, state: MarkerVisualState): MarkerIconSpec {
  const color = getBranchStatusColor(status);
  const isSelected = state === "selected";
  const isHover = state === "hover";
  const radius = isSelected ? 11 : isHover ? 9.5 : 8.5;
  const size = 40;
  const center = size / 2;

  const selectionRing = isSelected
    ? `<circle cx="${center}" cy="${center}" r="${radius + 4}" fill="none" stroke="#111827" stroke-width="2.5" />`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${selectionRing}<circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="3" /></svg>`;

  return { url: toDataUri(svg), width: size, height: size, anchorX: center, anchorY: center };
}

/** Prêt pour la Phase 6 (géolocalisation réelle) : point bleu classique,
 * distinct des marqueurs de magasin. Non utilisé tant que `userLocation` n'est
 * pas fourni (§16 — aucune géolocalisation déclenchée dans cette phase). */
export function buildUserLocationMarkerIconSpec(): MarkerIconSpec {
  const size = 24;
  const center = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${center}" cy="${center}" r="${center - 2}" fill="#2563eb" stroke="white" stroke-width="3" /></svg>`;
  return { url: toDataUri(svg), width: size, height: size, anchorX: center, anchorY: center };
}

/**
 * Icône de groupe (cluster) — un disque bleu de marque, volontairement
 * distinct des couleurs de statut (vert/ambre/gris/rouge) pour ne jamais
 * laisser croire qu'un groupe de magasins partage un seul statut. La taille
 * varie par palier grossier (pas de calcul continu coûteux) selon le nombre de
 * magasins regroupés — simple lisibilité, pas de design élaboré (§7).
 *
 * Le nombre lui-même n'est PAS dessiné dans ce SVG : il est confié au `label`
 * natif du marqueur Google (`components/maps/BranchCluster.ts`), formaté via
 * `Intl.NumberFormat(locale)` pour rester cohérent avec la langue active (§11).
 */
export function buildClusterIconSpec(count: number): MarkerIconSpec {
  const size = count >= 50 ? 56 : count >= 10 ? 48 : 40;
  const center = size / 2;
  const radius = center - 4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${center}" cy="${center}" r="${radius}" fill="#1d4ed8" stroke="white" stroke-width="3" opacity="0.92" /></svg>`;
  return { url: toDataUri(svg), width: size, height: size, anchorX: center, anchorY: center };
}

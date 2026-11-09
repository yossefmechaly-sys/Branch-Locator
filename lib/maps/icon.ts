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
  /** Point d'ancrage : pointe du repère magasin ou centre d'un disque. */
  anchorX: number;
  anchorY: number;
}

export type MarkerVisualState = "default" | "hover" | "selected";

/**
 * Le petit indicateur du repère conserve les couleurs des statuts de la liste.
 */
const STATUS_COLORS: Record<BranchStatus, string> = {
  OPEN: "#16a34a",
  OPENING_SOON: "#d97706",
  CLOSING_SOON: "#d97706",
  CLOSED: "#6b7280",
  TEMPORARILY_CLOSED: "#dc2626",
  HOURS_UNCONFIRMED: "#64748b",
};

export function getBranchStatusColor(status: BranchStatus): string {
  return STATUS_COLORS[status];
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Repère doré avec pictogramme magasin et halo à l'état sélectionné. */
export function buildBranchMarkerIconSpec(status: BranchStatus, state: MarkerVisualState): MarkerIconSpec {
  const color = getBranchStatusColor(status);
  const isSelected = state === "selected";
  const isHover = state === "hover";
  const width = isSelected ? 52 : isHover ? 46 : 40;
  const height = width * 56 / 48;
  const halo = isSelected
    ? '<circle cx="24" cy="24" r="23" fill="#3c87da" opacity=".3" />'
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">${halo}<path d="M24 52C20 46 6 34 6 23a18 18 0 0 1 36 0c0 11-14 23-18 29Z" fill="#3c87da" stroke="white" stroke-width="2.5"/><circle cx="24" cy="23" r="12" fill="#292b25"/><g fill="none" stroke="white" stroke-width="1.5" stroke-linejoin="round"><path d="M16 22l2-6h12l2 6M16 22q2 3 4 0 2 3 4 0 2 3 4 0 2 3 4 0M18 24v7h12v-7M22 31v-5h4v5"/></g><circle cx="36" cy="37" r="4" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;
  return { url: toDataUri(svg), width, height, anchorX: width / 2, anchorY: height * 52 / 56 };
}

/** Position de l'utilisateur : point bleu distinct des repères magasin. */
export function buildUserLocationMarkerIconSpec(): MarkerIconSpec {
  const size = 24;
  const center = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${center}" cy="${center}" r="${center - 2}" fill="#2563eb" stroke="white" stroke-width="3" /></svg>`;
  return { url: toDataUri(svg), width: size, height: size, anchorX: center, anchorY: center };
}

/**
 * Icône de groupe (cluster) — disque doré sans indicateur de statut partagé. La taille
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${center}" cy="${center}" r="${radius}" fill="#d9eaff" stroke="white" stroke-width="3" /><circle cx="${center}" cy="${center}" r="${radius - 3}" fill="none" stroke="#2874c9" stroke-width="1" /></svg>`;
  return { url: toDataUri(svg), width: size, height: size, anchorX: center, anchorY: center };
}

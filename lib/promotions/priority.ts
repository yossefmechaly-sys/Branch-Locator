/**
 * Tri et sélection "promotion du jour" (Phase 9, §8/§10) — fonctions pures,
 * jamais réimplémentées inline dans un composant. Comme
 * `lib/promotions/filter.ts`, ce module reste découplé de `services/` : il ne
 * connaît que le vocabulaire minimal nécessaire (`PromotionPriorityInput`),
 * pas `RawPromotion`/`LocalizedPromotion`.
 *
 * IMPORTANT — les deux fonctions ci-dessous supposent une liste DÉJÀ filtrée
 * comme active aujourd'hui (`lib/promotions/filter.ts#filterActivePromotions()`),
 * jamais appliquées à une liste brute non filtrée : trier/sélectionner une
 * promotion inactive n'a pas de sens, et `selectFeaturedPromotion()` ne doit
 * JAMAIS faire remonter une promotion `SCHEDULED`/`EXPIRED` même si elle
 * porte `isFeatured: true` (§10 — voir la promotion DEMO
 * "rosh-hashanah-honey", `isFeatured: true` mais `SCHEDULED`, qui ne doit
 * apparaître nulle part avant sa date de début).
 */
export interface PromotionPriorityInput {
  id: string;
  /** Ordre d'affichage manuel (§8) — départage secondaire, DESC. */
  priority: number;
  /** `true` si cette promotion est spécifiquement liée à CE magasin (via
   * `PromotionBranch`), `false` si elle s'applique globalement
   * (`appliesToAll`) — voir `LocalizedPromotion.isLocalToBranch`. */
  isLocalToBranch: boolean;
  /** "Promotion du jour" (§10) — interrupteur éditorial explicite. */
  isFeatured: boolean;
}

/**
 * Trie par : 1. locale AVANT globale (§8, priorité absolue) ; 2. `priority`
 * décroissant (plus grand = plus prioritaire) ; 3. `id` croissant (départage
 * final déterministe, pour un tri stable et reproductible d'un rendu à
 * l'autre — jamais un ordre "aléatoire" dépendant de l'ordre de retour SQL).
 * Ne mute jamais le tableau reçu (`[...promotions]`).
 */
export function sortPromotionsByPriority<T extends PromotionPriorityInput>(
  promotions: readonly T[]
): T[] {
  return [...promotions].sort((a, b) => {
    if (a.isLocalToBranch !== b.isLocalToBranch) return a.isLocalToBranch ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Sélectionne LA promotion "du jour" à mettre en avant (§10, badge "🔥
 * Promotion aujourd'hui" de la fiche magasin + aperçu compact
 * `BranchCard`/`BranchPopup`) — uniquement parmi celles réellement
 * `isFeatured: true` (jamais déduit d'une simple activité), puis la plus
 * prioritaire selon `sortPromotionsByPriority()`. `null` si aucune promotion
 * active de ce magasin n'est marquée `isFeatured` — c'est le cas le plus
 * courant, et c'est le signal exact que `BranchCard` utilise pour rester
 * inchangée (§13 : jamais de bloc promo si aucune promotion "featured" réelle
 * n'existe).
 */
export function selectFeaturedPromotion<T extends PromotionPriorityInput>(
  promotions: readonly T[]
): T | null {
  const featured = promotions.filter((promotion) => promotion.isFeatured);
  if (featured.length === 0) return null;
  return sortPromotionsByPriority(featured)[0];
}

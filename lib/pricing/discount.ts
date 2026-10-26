/**
 * Calcul de réduction (Phase 9, §5/§6) — fonction pure et testée, jamais
 * réimplémentée inline dans un composant React (même principe que
 * `lib/promotions/filter.ts#isPromotionActive()` pour la validité temporelle).
 *
 * Opère exclusivement sur des ENTIERS de centimes (voir
 * `lib/pricing/money.ts`) — l'addition/soustraction qui donne `amountCents`
 * reste une arithmétique entière exacte. Le `percentage` est le seul endroit
 * qui divise : un pourcentage n'est PAS un montant financier (rien n'est
 * arrondi à la baisse sur un prix affiché), c'est un ratio d'affichage — la
 * même remarque que dans `lib/pricing/money.ts` s'applique : le float
 * n'apparaît qu'à la toute dernière étape, jamais propagé plus loin.
 */
export interface DiscountResult {
  /** Montant économisé, en centimes entiers. */
  amountCents: number;
  /** Pourcentage de réduction, arrondi à l'entier le plus proche (ex. 25 pour "-25%"). */
  percentage: number;
}

/**
 * `originalPriceCents` est `null` (pas d'ancien prix connu) OU inférieur/égal
 * à `priceCents` (donnée de saisie incohérente, ou prix inchangé) : retourne
 * `null` dans les deux cas — JAMAIS de réduction artificielle affichée (§5,
 * impératif). L'appelant (`PromotionCard`) doit alors rendre le prix seul,
 * sans bloc "ancien prix"/badge de réduction.
 */
export function computeDiscount(priceCents: number, originalPriceCents: number | null): DiscountResult | null {
  if (originalPriceCents === null) return null;
  if (originalPriceCents <= priceCents) return null;

  const amountCents = originalPriceCents - priceCents;
  const percentage = Math.round((amountCents / originalPriceCents) * 100);

  return { amountCents, percentage };
}

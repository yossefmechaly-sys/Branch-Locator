/**
 * Types promotions (Phase 8, §11/§12 ; étendus Phase 9, §1-§15) — même
 * principe que `types/branch.ts`/`types/opening-hours.ts` : formes déjà
 * résolues/localisées consommées par l'UI, distinctes du modèle Prisma brut
 * (`services/branch.repository.ts` définit `RawPromotion`, plus proche du
 * schéma).
 */

/**
 * Statuts Prisma (`enum PromotionStatus`, `prisma/schema.prisma`), redéclarés
 * ici en union de chaînes littérales — comme pour `BranchStatus`
 * (`types/opening-hours.ts`), `@prisma/client` n'exporte ses types générés
 * qu'après `prisma generate` (indisponible dans ce bac à sable, voir le
 * résumé de Phase 3). Cette union reste synchronisée avec le schéma : toute
 * modification de l'enum Prisma doit s'accompagner de celle-ci.
 */
export type PromotionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "EXPIRED" | "ARCHIVED";

/**
 * Devise (Phase 9, §3) — union extensible synchronisée à la main avec
 * `prisma/schema.prisma#Currency` (même remarque que `PromotionStatus`
 * ci-dessus). MVP = ILS uniquement ; ajouter une devise ne demande qu'une
 * valeur supplémentaire ici + dans l'enum Prisma, jamais un changement de
 * structure. Jamais utilisée pour coder en dur un symbole (₪, $, …) — voir
 * `lib/pricing/money.ts#formatMoney()`, qui passe systématiquement par
 * `Intl.NumberFormat(locale, { style: "currency", currency })`.
 */
export type PromotionCurrency = "ILS";

/**
 * Unité de vente (Phase 9, §4) — synchronisée à la main avec
 * `prisma/schema.prisma#PromotionUnit`. Jamais stockée/affichée en texte
 * libre ("₪/kg") : chaque valeur a un libellé traduit par locale, résolu via
 * les clés `branchDetail.promotions.units.*` de `messages/{locale}.json`
 * (jamais dans `lib/`, qui reste indépendant de next-intl/React).
 */
export type PromotionUnit = "UNIT" | "KG" | "GRAM" | "LITER" | "ML" | "PACK" | "BOX";

/**
 * Promotion déjà localisée (traduction résolue avec repli hébreu, §5 Phase 8)
 * et déjà filtrée comme active à la date courante (§11 Phase 8) — c'est la
 * SEULE forme que `PromotionCard`/`BranchPromotions`/`BranchCard`/
 * `BranchPopup` consomment, jamais `RawPromotion` ni un calcul d'activité
 * dans le composant lui-même.
 *
 * Séparation stricte donnée traduite / non traduite (Phase 9, §15) :
 * `productName`/`title`/`description`/`ctaLabel` viennent de
 * `PromotionTranslation` (varient par langue) ; `price`/`originalPrice`/
 * `currency`/`unit`/`startDate`/`endDate`/`isFeatured`/`priority`/`slug`
 * viennent de `Promotion` (identiques quelle que soit la langue d'affichage).
 */
export interface LocalizedPromotion {
  id: string;
  slug: string;
  image: string | null;
  /** Nom du produit affiché (§1/§11), ex. "עוף טרי"/"Poulet frais" — distinct
   * de `title` (accroche de la promotion, ex. "מבצע היום"). `null` pour une
   * promotion éditoriale sans produit structuré. */
  productName: string | null;
  title: string;
  description: string | null;
  ctaLabel: string | null;
  /** URL externe configurée (`Promotion.url`) — `null` si aucun CTA n'est configuré. */
  ctaUrl: string | null;
  /** "YYYY-MM-DD", pour un affichage optionnel de la période (§12 : « période si utile »). */
  startDate: string;
  endDate: string;
  /**
   * Tarification structurée (§1/§2/§5) — chaînes décimales ("29.90"), JAMAIS
   * un nombre flottant JS, cohérent de bout en bout avec `Promotion.price`
   * (`Decimal` Prisma) jusqu'à l'affichage (`lib/pricing/money.ts`, converti
   * en centimes entiers avant tout calcul/formatage). `price: null` signale
   * une promotion éditoriale sans produit — dans ce cas `originalPrice`,
   * `currency` et `unit` n'ont pas de sens et doivent être ignorés par l'UI
   * (voir `PromotionCard`, qui bascule sur un rendu "bannière" sans bloc prix).
   */
  price: string | null;
  originalPrice: string | null;
  currency: PromotionCurrency;
  unit: PromotionUnit;
  /** "Promotion du jour" (§10) — interrupteur éditorial explicite, jamais
   * déduit du seul fait que la promotion est active aujourd'hui. */
  isFeatured: boolean;
  /** Ordre d'affichage manuel (§8) — voir `lib/promotions/priority.ts`. */
  priority: number;
  /** Vrai si cette promotion est spécifiquement liée à CE magasin (via
   * `PromotionBranch`), faux si elle s'applique globalement
   * (`appliesToAll`) — utilisé par `lib/promotions/priority.ts` pour trier
   * "locale avant globale" (§8), jamais recalculé dans un composant. */
  isLocalToBranch: boolean;
}

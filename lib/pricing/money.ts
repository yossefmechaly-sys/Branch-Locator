import type { AppLocale } from "@/types/i18n";
import type { PromotionCurrency } from "@/types/promotion";

/**
 * Arithmétique monétaire — Phase 9, §2 : « le frontend ne doit jamais
 * effectuer de calcul financier approximatif avec des floats ». `Promotion.
 * price`/`originalPrice` sont des `Decimal` Prisma côté base (jamais
 * `Float`), transmis à travers toute la chaîne applicative
 * (`RawPromotion` → `LocalizedPromotion`) comme de simples CHAÎNES décimales
 * ("29.90"), jamais convertis en `number` avant d'atteindre ce module.
 *
 * Stratégie retenue : convertir chaque chaîne décimale en un nombre ENTIER de
 * centimes (`decimalStringToCents`) dès la frontière, puis n'effectuer QUE de
 * l'arithmétique entière (addition/soustraction, jamais de division sujette à
 * l'imprécision binaire — voir `lib/pricing/discount.ts` pour le seul calcul
 * qui divise, un pourcentage, qui n'est justement PAS un montant financier).
 * Le retour à un `number` JS flottant n'a lieu qu'à la toute dernière étape,
 * pour `Intl.NumberFormat` (`formatMoney`), qui l'exige nativement — c'est le
 * même principe que n'importe quelle API de paiement basée sur les centimes
 * (Stripe, etc.) : le float n'apparaît jamais dans un CALCUL, seulement à la
 * frontière d'affichage, où `Intl.NumberFormat` gère lui-même l'arrondi.
 */

const DECIMAL_STRING_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Convertit une chaîne décimale ("29.9", "29.90", "150") en un entier de
 * centimes (2990, 2990, 15000) — par manipulation de chaîne uniquement,
 * jamais par `parseFloat`/`Number(...) * 100` (imprécision binaire, ex.
 * `0.1 + 0.2 !== 0.3`). Lève si la valeur n'est pas un décimal positif valide
 * avec au plus 2 décimales (cohérent avec `@db.Decimal(10, 2)`).
 */
export function decimalStringToCents(value: string): number {
  const trimmed = value.trim();
  if (!DECIMAL_STRING_PATTERN.test(trimmed)) {
    throw new Error(`decimalStringToCents : chaîne décimale invalide "${value}"`);
  }
  const [wholePart, fractionPart = ""] = trimmed.split(".");
  const paddedFraction = fractionPart.padEnd(2, "0");
  return Number(wholePart) * 100 + Number(paddedFraction);
}

/** Conversion inverse — utilisée surtout par les tests et par tout code ayant
 * besoin de re-sérialiser un montant en centimes vers une chaîne décimale. */
export function centsToDecimalString(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`centsToDecimalString : centimes invalides (${cents})`);
  }
  const wholePart = Math.trunc(cents / 100);
  const fractionPart = String(cents % 100).padStart(2, "0");
  return `${wholePart}.${fractionPart}`;
}

/**
 * Formate un montant en centimes selon la devise et la locale actives
 * (Phase 9, §3) — TOUJOURS via `Intl.NumberFormat`, jamais de symbole codé en
 * dur (`₪`, `$`, …). `locale` est passée telle quelle (`"he"`, `"fr"`, …),
 * exactement comme le fait déjà `lib/geolocation/distance.ts#formatDistanceMeters()`
 * et `components/maps/BranchCluster.ts` ailleurs dans le projet — `Intl`
 * résout correctement ces codes courts sans qu'il soit nécessaire de les
 * faire correspondre à des tags BCP-47 complets ("he-IL", "fr-FR", …).
 *
 * La division par 100 ici reproduit un `number` flottant à la toute dernière
 * étape, uniquement pour satisfaire la signature de `Intl.NumberFormat` — ce
 * n'est PAS un calcul financier (aucune perte de précision possible pour un
 * entier de centimes ≤ 2^53, largement suffisant pour un prix de supermarché).
 */
export function formatMoney(cents: number, currency: PromotionCurrency, locale: AppLocale): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

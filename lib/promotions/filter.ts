import { getIsraelNow } from "@/lib/opening-hours/timezone";
import type { PromotionStatus } from "@/types/promotion";

/**
 * Forme minimale nécessaire pour juger de l'activité d'une promotion —
 * délibérément plus petite que `RawPromotion` (`services/branch.repository.ts`),
 * comme `NavigationTarget` (`lib/navigation/types.ts`, Phase 6) : ce module
 * `lib/` reste découplé de la couche `services/`, ne dépend que du
 * vocabulaire partagé (`types/promotion.ts`).
 */
export interface PromotionActivityInput {
  status: PromotionStatus;
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" */
  endDate: string;
}

/**
 * Détermine si une promotion est active "maintenant" (§11 Phase 8) — les DEUX
 * conditions doivent être vraies, jamais une seule :
 *  1. `status === "ACTIVE"` (un statut `DRAFT`/`SCHEDULED`/`EXPIRED`/`ARCHIVED`
 *     ne doit JAMAIS s'afficher publiquement, même si les dates couvrent la
 *     période courante — c'est un interrupteur éditorial explicite, distinct
 *     des dates).
 *  2. La date du jour (Israël — voir §2 ci-dessous) tombe dans
 *     `[startDate, endDate]` inclus des deux côtés.
 *
 * Une promotion au statut `ACTIVE` mais dont les dates ne couvrent pas encore/
 * plus aujourd'hui (erreur de saisie admin, ou fenêtre expirée sans que le
 * statut ait été mis à jour) reste donc exclue — jamais affichée « en avance »
 * ni « en retard » (§11 : « ne pas afficher les promotions expirées »).
 *
 * Comparaison de dates dans le fuseau Asia/Jerusalem (`getIsraelNow()`,
 * `lib/opening-hours/timezone.ts`, Phase 7) plutôt que sur le fuseau du
 * serveur — même règle de centralisation du fuseau horaire que le moteur
 * d'horaires, appliquée ici au domaine promotions plutôt que réinventée.
 * `startDate`/`endDate`/`isoDate` sont tous au format "YYYY-MM-DD", qui se
 * compare correctement lexicographiquement (pas besoin de parser en `Date`).
 */
export function isPromotionActive(promotion: PromotionActivityInput, referenceDate: Date): boolean {
  if (promotion.status !== "ACTIVE") return false;

  const todayIsoDate = getIsraelNow(referenceDate).isoDate;
  return promotion.startDate <= todayIsoDate && todayIsoDate <= promotion.endDate;
}

/**
 * Filtre une liste de promotions candidates (déjà résolues côté repository
 * comme "globales OU liées à ce magasin", §11) pour ne garder que celles
 * réellement actives aujourd'hui. Ordre conservé tel que reçu — le tri
 * éventuel (ex. par date de fin la plus proche) reste une décision d'affichage
 * hors du périmètre de cette fonction pure. Générique (`T extends
 * PromotionActivityInput`) pour s'appliquer directement à `RawPromotion[]`
 * sans que ce module ait besoin de connaître ce type.
 */
export function filterActivePromotions<T extends PromotionActivityInput>(
  promotions: readonly T[],
  referenceDate: Date
): T[] {
  return promotions.filter((promotion) => isPromotionActive(promotion, referenceDate));
}

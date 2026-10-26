import type { BranchSummary, LocalizedCity } from "@/types/branch";

export type SearchMatchType = "city" | "branch" | "other" | "none";

export interface SearchClassification {
  matchType: SearchMatchType;
  resultCount: number;
  /** Renseigné UNIQUEMENT quand `matchType === "city"` — identifiant stable
   * (jamais le nom localisé, qui varie par langue), pour §14 "villes les
   * plus recherchées". Ce n'est PAS une donnée personnelle : c'est un lieu
   * recherché, pas une information sur le chercheur — même principe déjà
   * accepté pour `branchId` sur les autres événements. */
  matchedCitySlug: string | null;
  /** Renseigné UNIQUEMENT quand `matchType === "branch"` — pour §14 "magasins
   * les plus recherchés". Même principe. */
  matchedBranchId: string | null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Classifie une recherche SANS jamais transmettre la chaîne saisie à
 * l'analytics (Phase 10, §4 — minimisation de la vie privée : « évite de
 * stocker aveuglément toute chaîne saisie »). Renvoie en revanche un
 * identifiant STABLE (slug de ville / id de magasin, jamais un texte libre)
 * quand la recherche est reconnue comme correspondant précisément à l'un des
 * deux — nécessaire pour le classement §14 ("villes/magasins les plus
 * recherchés"), sans jamais réintroduire de texte arbitraire.
 *
 * Heuristique VOLONTAIREMENT simple, calculée uniquement à partir de données
 * déjà publiques renvoyées par `GET /api/branches` (jamais une seconde
 * requête, jamais un accès direct à `lib/search`) :
 *
 * - "city" : la requête correspond au nom d'une ville active connue
 *   (`cities` = ensemble ACTIF complet, pas le sous-ensemble déjà filtré —
 *   voir `services/branch.service.ts#getBranchLocatorData`).
 * - "branch" : sinon, au moins un magasin RETOURNÉ (donc déjà trouvé par la
 *   recherche serveur, quelle qu'en soit la raison exacte) a un nom affiché
 *   contenant la requête — un indice raisonnable qu'elle correspondait à un
 *   nom de magasin plutôt qu'à une ville. Le PREMIER magasin correspondant
 *   est retenu comme `matchedBranchId` (une recherche ne "cible" en pratique
 *   presque toujours qu'un seul magasin par son nom).
 * - "other" : des résultats existent mais ne correspondent ni à une ville ni
 *   à un nom de magasin reconnaissable (adresse, alias, service...).
 * - "none" : aucun résultat (§14 : donnée commerciale importante — révèle une
 *   zone potentiellement sans magasin).
 *
 * Fonction pure, testée indépendamment (`tests/unit/search-classification.test.ts`).
 */
export function classifySearch(
  query: string,
  cities: Pick<LocalizedCity, "name" | "slug">[],
  branches: Pick<BranchSummary, "id" | "displayName">[]
): SearchClassification {
  const resultCount = branches.length;
  const normalizedQuery = normalize(query);

  if (!normalizedQuery || resultCount === 0) {
    return { matchType: "none", resultCount: 0, matchedCitySlug: null, matchedBranchId: null };
  }

  const matchedCity = cities.find((city) => {
    const name = normalize(city.name);
    return name.includes(normalizedQuery) || normalizedQuery.includes(name);
  });
  if (matchedCity) {
    return { matchType: "city", resultCount, matchedCitySlug: matchedCity.slug, matchedBranchId: null };
  }

  const matchedBranch = branches.find((branch) => normalize(branch.displayName).includes(normalizedQuery));
  if (matchedBranch) {
    return { matchType: "branch", resultCount, matchedCitySlug: null, matchedBranchId: matchedBranch.id };
  }

  return { matchType: "other", resultCount, matchedCitySlug: null, matchedBranchId: null };
}

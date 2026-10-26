import { locales, type AppLocale } from "@/types/i18n";
import type { BranchDetail, BranchLocatorResult, BranchSummary, LocalizedCity, LocalizedService } from "@/types/branch";
import type { BranchStatusViewModel } from "@/types/opening-hours";
import type { LocalizedPromotion } from "@/types/promotion";
import { buildBranchStatusViewModel } from "@/lib/opening-hours/view-model";
import { isOpenStatus } from "@/lib/opening-hours/open-at";
import { filterBySearchQuery, type SearchableRecord } from "@/lib/search/search";
import { applyBranchFilters, type BranchFilterState, type FilterableBranch } from "@/lib/filters/branch-filters";
import { filterActivePromotions } from "@/lib/promotions/filter";
import { selectFeaturedPromotion, sortPromotionsByPriority } from "@/lib/promotions/priority";

import { resolveTranslation } from "./locale-projection";
import { prismaBranchRepository } from "./branch.repository.prisma";
import type { BranchRepository, RawBranch, RawCity, RawPromotion, RawService } from "./branch.repository";

/**
 * Orchestration du Store Locator — le SEUL point d'entrée que les routes API et
 * les Server Components sont autorisés à appeler pour obtenir des données de
 * magasin (§1 de la Phase 4 : aucune donnée codée en dur dans les composants,
 * tout passe par cette couche service/API).
 *
 * Compose, dans l'ordre : récupération (`repository`) → statut horaire
 * (`lib/opening-hours`) → recherche texte (`lib/search`) → filtres
 * (`lib/filters`) → projection localisée (`locale-projection`). Chaque étape est
 * un module indépendant et testable ; ce fichier ne fait que les brancher
 * ensemble (§7 : ne pas mettre toute la logique dans un composant).
 */
export interface BranchLocatorParams {
  locale: AppLocale;
  q?: string;
  citySlug?: string | null;
  serviceSlug?: string | null;
  isOpenNow?: boolean;
}

function localizeCity(city: RawCity, locale: AppLocale): LocalizedCity {
  const { translation } = resolveTranslation(city.translations, locale);
  return {
    id: city.id,
    slug: city.slug,
    name: translation.name,
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

function localizeService(service: RawService, locale: AppLocale): LocalizedService {
  const { translation } = resolveTranslation(service.translations, locale);
  return {
    id: service.id,
    slug: service.slug,
    icon: service.icon,
    name: translation.name,
    description: translation.description,
  };
}

/** Même règle de repli hébreu (§5 Phase 8) que `localizeCity`/`localizeService`
 * ci-dessus — `resolveTranslation()` reste le SEUL endroit qui l'implémente.
 * `isLocalToBranch` (Phase 9, §8) se déduit directement de `appliesToAll` :
 * une promotion parvenue jusqu'ici est déjà résolue par le repository comme
 * "globale OU liée à CE magasin" (voir `RawBranch.promotions`), donc
 * `!appliesToAll` signifie nécessairement "liée spécifiquement à ce magasin",
 * sans requête ni donnée supplémentaire. */
function localizePromotion(promotion: RawPromotion, locale: AppLocale): LocalizedPromotion {
  const { translation } = resolveTranslation(promotion.translations, locale);
  return {
    id: promotion.id,
    slug: promotion.slug,
    image: promotion.image,
    productName: translation.productName,
    title: translation.title,
    description: translation.description,
    ctaLabel: translation.ctaLabel,
    ctaUrl: promotion.url,
    startDate: promotion.startDate,
    endDate: promotion.endDate,
    price: promotion.price,
    originalPrice: promotion.originalPrice,
    currency: promotion.currency,
    unit: promotion.unit,
    isFeatured: promotion.isFeatured,
    priority: promotion.priority,
    isLocalToBranch: !promotion.appliesToAll,
  };
}

/**
 * Termes de recherche rassemblés dans les CINQ langues (traductions de magasin et
 * de ville) + tous les `SearchAlias`, jamais uniquement la langue d'affichage
 * courante — c'est ce qui garantit que "ירושלים" / "Jerusalem" / "Иерусалим" /
 * "Jérusalem" / "Jerusalén" retournent les mêmes résultats quelle que soit la
 * langue de l'interface (§6).
 */
function buildSearchTerms(branch: RawBranch): string[] {
  const terms: string[] = [branch.branchCode, branch.address];

  for (const locale of locales) {
    const branchTranslation = branch.translations.find((t) => t.locale === locale);
    if (branchTranslation) terms.push(branchTranslation.displayName);

    const cityTranslation = branch.city.translations.find((t) => t.locale === locale);
    if (cityTranslation) terms.push(cityTranslation.name);
  }

  for (const alias of branch.searchAliases) {
    terms.push(alias.alias);
  }

  return terms;
}

function toSummary(
  branch: RawBranch,
  locale: AppLocale,
  statusViewModel: BranchStatusViewModel,
  featuredPromotion: LocalizedPromotion | null
): BranchSummary {
  const { translation } = resolveTranslation(branch.translations, locale);

  return {
    id: branch.id,
    slug: branch.slug,
    branchCode: branch.branchCode,
    displayName: translation.displayName,
    city: localizeCity(branch.city, locale),
    district: branch.district,
    address: branch.address,
    latitude: branch.latitude,
    longitude: branch.longitude,
    phone: branch.phone,
    whatsappNumber: branch.whatsappNumber,
    mainImage: branch.mainImage,
    isDemo: branch.isDemo,
    status: statusViewModel.status,
    todayHours: statusViewModel.todayHours,
    isSpecialDay: statusViewModel.isSpecialDay,
    specialDayTitle: statusViewModel.specialDayTitle,
    minutesUntilChange: statusViewModel.minutesUntilChange,
    distanceMeters: null,
    // Horaires bruts (Phase 7, §16/§17) : nécessaires à `OpeningHours` côté
    // `BranchCard`, ET au rafraîchissement client (`refreshBranchStatuses()`,
    // §19) qui recalcule `statusViewModel` sans jamais refaire d'appel réseau.
    openingHours: branch.openingHours,
    specialHours: branch.specialHours,
    // Objet complet déjà calculé (§16/§17/§21) — `BranchCard`/`BranchPopup` ne
    // consomment plus que ceci pour tout ce qui concerne le statut horaire.
    statusViewModel,
    services: branch.services
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((service) => localizeService(service, locale)),
    featuredPromotion,
  };
}

interface BranchWithComputedData extends SearchableRecord, FilterableBranch {
  branch: RawBranch;
  statusViewModel: BranchStatusViewModel;
}

export async function getBranchLocatorData(
  params: BranchLocatorParams,
  repository: BranchRepository = prismaBranchRepository
): Promise<BranchLocatorResult> {
  const rawBranches = await repository.getActiveBranches();

  // Un seul `referenceDate` pour TOUS les magasins de cette requête (Phase 7,
  // §21) — jamais un `new Date()` légèrement différent d'un magasin à
  // l'autre, ce qui pourrait faire diverger deux magasins tout proches d'un
  // changement de statut (ex. fermeture à 22:00) au sein d'une même réponse.
  const referenceDate = new Date();

  // Statut + termes de recherche calculés une seule fois par magasin, réutilisés
  // à la fois pour le filtre "ouvert maintenant" et pour l'affichage final.
  const computed: BranchWithComputedData[] = rawBranches.map((branch) => {
    const statusViewModel = buildBranchStatusViewModel(
      { openingHours: branch.openingHours, specialHours: branch.specialHours },
      referenceDate
    );
    return {
      branch,
      statusViewModel,
      searchTerms: buildSearchTerms(branch),
      citySlug: branch.city.slug,
      serviceSlugs: branch.services.map((service) => service.slug),
      isOpenNow: isOpenStatus(statusViewModel.status),
    };
  });

  const searched = params.q ? filterBySearchQuery(computed, params.q) : computed;

  const filterState: BranchFilterState = {
    citySlug: params.citySlug ?? null,
    serviceSlug: params.serviceSlug ?? null,
    isOpenNow: params.isOpenNow ?? false,
  };
  const filtered = applyBranchFilters(searched, filterState);

  const branches = filtered
    .map((entry) => {
      // Promotion "du jour" éventuelle (Phase 9, §10/§13) — calculée à partir
      // des SEULES promotions réellement actives aujourd'hui pour ce magasin
      // (même moteur `filterActivePromotions()` que la fiche détaillée,
      // §11 Phase 8, jamais un second calcul divergent), puis la sélection
      // "featured + prioritaire" de `lib/promotions/priority.ts` — jamais
      // déduite ici d'une simple activité (§10, impératif).
      const activePromotions = filterActivePromotions(entry.branch.promotions, referenceDate).map(
        (promotion) => localizePromotion(promotion, params.locale)
      );
      const featuredPromotion = selectFeaturedPromotion(activePromotions);
      return toSummary(entry.branch, params.locale, entry.statusViewModel, featuredPromotion);
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, params.locale));

  // Les options de filtre viennent de l'ensemble ACTIF complet (pas du
  // sous-ensemble déjà recherché/filtré), pour que les listes déroulantes ne se
  // vident jamais au fil de la recherche.
  const cityBySlug = new Map<string, LocalizedCity>();
  const serviceBySlug = new Map<string, LocalizedService>();
  for (const branch of rawBranches) {
    const city = localizeCity(branch.city, params.locale);
    cityBySlug.set(city.slug, city);
    for (const service of branch.services) {
      serviceBySlug.set(service.slug, localizeService(service, params.locale));
    }
  }

  return {
    branches,
    cities: Array.from(cityBySlug.values()).sort((a, b) => a.name.localeCompare(b.name, params.locale)),
    services: Array.from(serviceBySlug.values()).sort((a, b) =>
      a.name.localeCompare(b.name, params.locale)
    ),
    total: branches.length,
  };
}

/**
 * Point d'entrée UNIQUE pour la fiche détaillée d'un magasin
 * (`/[locale]/branches/[slug]`, Phase 8, §4) — retourne `null` si le magasin
 * n'existe pas OU est inactif (`BranchRepository#getBranchBySlug()` traite
 * déjà les deux cas indistinctement, §1/§35) ; c'est à l'appelant (la page)
 * d'appeler `notFound()` dans ce cas, jamais de rendre une page vide.
 *
 * Une SEULE requête repository (`getBranchBySlug`, elle-même une fonction du
 * repository — deux requêtes SQL en interne, voir
 * `branch.repository.prisma.ts`, mais UN SEUL appel depuis ici) — la page ne
 * doit donc faire QU'UN SEUL appel à `getBranchDetailBySlug()`, jamais
 * plusieurs requêtes indépendantes (§4).
 *
 * Réutilise EXACTEMENT `buildBranchStatusViewModel()` (Phase 7) — même
 * moteur, mêmes garanties (§8 Phase 8 : « ne recrée aucune logique
 * horaire ») — et `filterActivePromotions()` (§11) pour ne conserver que les
 * promotions réellement actives aujourd'hui.
 */
export async function getBranchDetailBySlug(
  slug: string,
  locale: AppLocale,
  repository: BranchRepository = prismaBranchRepository
): Promise<BranchDetail | null> {
  const branch = await repository.getBranchBySlug(slug);
  if (!branch) return null;

  const referenceDate = new Date();
  const statusViewModel = buildBranchStatusViewModel(
    { openingHours: branch.openingHours, specialHours: branch.specialHours },
    referenceDate
  );

  const { translation } = resolveTranslation(branch.translations, locale);
  const activePromotions = filterActivePromotions(branch.promotions, referenceDate).map((promotion) =>
    localizePromotion(promotion, locale)
  );
  // Ordre d'affichage (§8 Phase 9) : locales avant globales, puis `priority`
  // décroissant — jamais l'ordre brut de retour du repository. La promotion
  // "featured" du badge fiche magasin réutilise la MÊME sélection que
  // `getBranchLocatorData()` (Store Locator), jamais un second calcul
  // divergent (`lib/promotions/priority.ts`, source unique).
  const sortedPromotions = sortPromotionsByPriority(activePromotions);
  const featuredPromotion = selectFeaturedPromotion(activePromotions);

  return {
    ...toSummary(branch, locale, statusViewModel, featuredPromotion),
    description: translation.description,
    seoTitle: translation.seoTitle,
    seoDescription: translation.seoDescription,
    postalCode: branch.postalCode,
    email: branch.email,
    whatsappGroupUrl: branch.whatsappGroupUrl,
    wazeUrlOverride: branch.wazeUrlOverride,
    images: branch.images.map((image) => ({ imageUrl: image.imageUrl, alt: image.alt })),
    promotions: sortedPromotions,
  };
}

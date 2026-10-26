import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { NowProvider } from "@/components/branches/NowProvider";
import { Breadcrumbs } from "@/components/branches/Breadcrumbs";
import { BranchHero } from "@/components/branches/BranchHero";
import { BranchGallery } from "@/components/branches/BranchGallery";
import { BranchServices } from "@/components/branches/BranchServices";
import { BranchPromotions } from "@/components/branches/BranchPromotions";
import { OpeningHoursLive } from "@/components/branches/OpeningHoursLive";
import { BranchDetailMap } from "@/components/branches/BranchDetailMap";
import { NearbyBranches } from "@/components/branches/NearbyBranches";
import { BranchStickyActionBar } from "@/components/branches/BranchStickyActionBar";
import { BranchViewTracker } from "@/components/branches/BranchViewTracker";
import { BranchReviews } from "@/components/branches/BranchReviews";
import { getPublicBranchReviews } from "@/services/review.service";
import { getBranchDetailBySlug, getBranchLocatorData } from "@/services/branch.service";
import { getSiteUrl } from "@/lib/seo/site";
import { buildBranchUrl } from "@/lib/seo/branch-urls";
import { buildBranchMetadata } from "@/lib/seo/metadata";
import { buildGroceryStoreSchema } from "@/lib/seo/schema";
import { buildGoogleMapsUrl } from "@/lib/navigation/google-maps";
import { locales, defaultLocale, type AppLocale } from "@/types/i18n";

interface BranchDetailPageParams {
  locale: string;
  slug: string;
}

/**
 * Stratégie de cache/ISR (Phase 8, §34) : la page est régénérée au maximum
 * toutes les 60 secondes (même fréquence que le moteur
 * d'horaires, `lib/opening-hours/config.ts`) — jamais des heures, jamais
 * `force-static`/`revalidate: false`. Ce choix n'est PAS arbitraire : c'est
 * exactement la même cadence que le timer client (`useNow`, §8/§20) qui
 * rafraîchit le statut « ouvert/fermé » après hydratation. Concrètement :
 * - Le HTML servi par le CDN/ISR ne peut donc jamais afficher un statut vieux
 *   de plus de 60 s au tout premier rendu (avant même l'hydratation).
 * - Une fois hydratée, la page continue de se rafraîchir côté client toutes
 *   les 60 s indépendamment de toute régénération serveur (§8, impératif :
 *   « ne jamais mettre en cache statiquement le texte "ouvert maintenant"
 *   pendant des heures »).
 * Le reste du contenu (nom, adresse, galerie, services, promotions, SEO) est
 * parfaitement statique entre deux régénérations — bénéficier du cache ISR
 * pour CE contenu-là est sans risque, contrairement au statut horaire.
 */
export const revalidate = 60;

/**
 * Dédoublonne l'appel entre `generateMetadata()` et le composant de page —
 * les deux s'exécutent pour la même requête (React `cache()`, portée par
 * requête de rendu) : reste malgré tout UN SEUL point d'entrée logique
 * (`getBranchDetailBySlug`, §4), jamais une seconde implémentation de
 * requête.
 */
const getCachedBranchDetail = cache((slug: string, locale: AppLocale) =>
  getBranchDetailBySlug(slug, locale)
);

/**
 * Pré-génère toutes les fiches DEMO actives, dans les cinq langues, au build
 * (§34) — `slug` étant stable d'une langue à l'autre (§6), une seule requête
 * de la liste des magasins (langue par défaut, les noms localisés n'important
 * pas ici) suffit à connaître tous les `slug` à croiser avec `locales`.
 * `dynamicParams` reste à sa valeur par défaut (`true`) : un magasin ajouté
 * après le build resterait accessible via un rendu à la demande plutôt que de
 * provoquer un 404 (aucune UI d'administration cette phase, mais ce choix
 * n'a pas de coût et évite de casser silencieusement un futur ajout).
 */
export async function generateStaticParams(): Promise<BranchDetailPageParams[]> {
  const { branches } = await getBranchLocatorData({ locale: defaultLocale });
  return locales.flatMap((locale) => branches.map((branch) => ({ locale, slug: branch.slug })));
}

export async function generateMetadata(props: {
  params: Promise<BranchDetailPageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const appLocale = locale as AppLocale;

  const branch = await getCachedBranchDetail(slug, appLocale);
  // Le magasin inexistant/inactif reçoit des métadonnées minimales — la page
  // elle-même appelle `notFound()` juste après, et Next.js force `noindex`
  // sur toute réponse 404 (§35/§37 : jamais indexer une fiche invalide).
  if (!branch) return {};

  const t = await getTranslations({ locale, namespace: "branchDetail.seo" });
  const fallbackTitle = t("fallbackTitle", { displayName: branch.displayName, cityName: branch.city.name });
  const fallbackDescription = t("fallbackDescription", {
    displayName: branch.displayName,
    cityName: branch.city.name,
  });

  return buildBranchMetadata({
    locale: appLocale,
    slug: branch.slug,
    seoTitle: branch.seoTitle,
    seoDescription: branch.seoDescription,
    description: branch.description,
    mainImage: branch.mainImage,
    fallbackTitle,
    fallbackDescription,
  });
}

/**
 * Fiche magasin (`/[locale]/branches/[slug]`, Phase 8) — Server Component :
 * porte la donnée, le SEO, le fil d'Ariane, les horaires et le contenu
 * textuel ; seules les sections réellement interactives (`BranchHero` inclut
 * `BranchStatusLive`/`BranchActions`, `BranchGallery`, `OpeningHoursLive`,
 * `BranchDetailMap`, `BranchStickyActionBar`, `BranchViewTracker`) descendent
 * en Client Component (§3) — jamais la page entière.
 *
 * `notFound()` couvre indistinctement magasin inexistant ET inactif (§1/§35) —
 * `getBranchDetailBySlug()` retourne `null` dans les deux cas, cette page ne
 * fait aucune distinction supplémentaire.
 */
export default async function BranchDetailPage(props: {
  params: Promise<BranchDetailPageParams>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const branch = await getCachedBranchDetail(slug, appLocale);
  if (!branch) {
    notFound();
  }

  const t = await getTranslations("branchDetail");

  const siteUrl = getSiteUrl();
  const homeUrl = `${siteUrl}/${appLocale}`;
  const branchesUrl = `${siteUrl}/${appLocale}/branches`;

  // URL Google Maps déjà construite par `lib/navigation/*` (§16) — jamais
  // réassemblée ici, y compris pour le JSON-LD (`hasMap`).
  const mapUrl = buildGoogleMapsUrl({
    latitude: branch.latitude,
    longitude: branch.longitude,
    address: `${branch.address}, ${branch.city.name}`,
    wazeUrlOverride: branch.wazeUrlOverride,
  });

  // `Offer` Schema.org (Phase 9, §17) — UNIQUEMENT les promotions actives de
  // ce magasin dont le prix est réellement connu (jamais une promotion
  // éditoriale sans produit, ni un prix deviné) : voir la décision documentée
  // sur `GroceryStoreSchemaInput.offers` (`lib/seo/schema.ts`).
  const offers = branch.promotions
    .filter((promotion) => promotion.price !== null)
    .map((promotion) => ({
      price: promotion.price as string,
      currency: promotion.currency,
      name: promotion.productName,
      url: promotion.ctaUrl,
      validFrom: promotion.startDate,
      validThrough: promotion.endDate,
    }));

  const schema = buildGroceryStoreSchema({
    name: branch.displayName,
    url: buildBranchUrl(appLocale, branch.slug),
    image: branch.mainImage,
    telephone: branch.phone,
    streetAddress: branch.address,
    addressLocality: branch.city.name,
    postalCode: branch.postalCode,
    latitude: branch.latitude,
    longitude: branch.longitude,
    openingHours: branch.openingHours,
    mapUrl,
    offers,
  });

  // Autres magasins de la même ville (§30) — requête clairement DISTINCTE de
  // la fiche elle-même (une liste d'AUTRES magasins, pas un fragment de CE
  // magasin) : `getBranchDetailBySlug()` reste le seul point d'entrée pour
  // les données propres à la fiche (§4). Réutilise `getBranchLocatorData()`
  // (Store Locator, Phase 4) plutôt qu'une nouvelle requête repository.
  const cityResult = await getBranchLocatorData({ locale: appLocale, citySlug: branch.city.slug });
  const nearbyBranches = cityResult.branches.filter((other) => other.id !== branch.id).slice(0, 4);
  const reviews = await getPublicBranchReviews(branch.slug);

  return (
    <NowProvider>
      <JsonLd data={schema} />
      <BranchViewTracker branchId={branch.id} />

      <div className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-10 md:pb-10">

        <Breadcrumbs
          locale={appLocale}
          cityName={branch.city.name}
          citySlug={branch.city.slug}
          branchDisplayName={branch.displayName}
          homeUrl={homeUrl}
          branchesUrl={branchesUrl}
        />

        <div className="mt-4 flex flex-col gap-8">
          <BranchHero branch={branch} />

          <BranchGallery images={branch.images} branchName={branch.displayName} />

          {branch.description && (
            <section aria-labelledby="branch-about-heading" className="flex flex-col gap-3">
              <h2 id="branch-about-heading" className="text-lg font-semibold tracking-tight">
                {t("about.sectionTitle")}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {branch.description}
              </p>
            </section>
          )}

          <BranchPromotions promotions={branch.promotions} branchId={branch.id} locale={appLocale} />

          <BranchServices services={branch.services} />

          <section aria-labelledby="branch-hours-heading" className="flex flex-col gap-3">
            <h2 id="branch-hours-heading" className="text-lg font-semibold tracking-tight">
              {t("hours.sectionTitle")}
            </h2>
            <OpeningHoursLive openingHours={branch.openingHours} specialHours={branch.specialHours} />
          </section>

          <BranchDetailMap branch={branch} locale={appLocale} />

          <BranchReviews key={branch.slug} slug={branch.slug} initial={reviews} />

          <NearbyBranches branches={nearbyBranches} cityName={branch.city.name} locale={appLocale} />
        </div>
      </div>

      <BranchStickyActionBar branch={branch} />
    </NowProvider>
  );
}

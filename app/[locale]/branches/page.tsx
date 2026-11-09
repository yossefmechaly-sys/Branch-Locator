import type { Metadata } from "next";
import localFont from "next/font/local";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BranchLocator } from "@/components/branches/BranchLocator";
import { StorefrontIllustration } from "@/components/branches/StorefrontIllustration";
import { getBranchLocatorData } from "@/services/branch.service";
import { buildLocaleHreflangAlternates } from "@/lib/seo/branch-urls";
import type { AppLocale } from "@/types/i18n";

const hebrewHeading = localFont({
  src: "../../../assets/fonts/Heebo-Variable.ttf",
  weight: "100 900",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "branches" });
  return {
    title: t("title"),
    description: t("subtitle"),
    // Phase 11, §16 (correctif défaut réel, audit SEO) : sans ceci, cette
    // page héritait du `alternates.languages` générique du layout racine
    // (`{ he: "/he", ... }`, sans `x-default`), en contradiction avec le
    // header `Link` correct émis par le middleware next-intl pour cette même
    // page — voir le commentaire détaillé sur `buildLocaleHreflangAlternates()`.
    alternates: {
      languages: buildLocaleHreflangAlternates("/branches"),
    },
  };
}

/**
 * Store Locator (Phase 4).
 *
 * Rendu serveur : les données initiales viennent directement de
 * `services/branch.service.ts` (Server Component, jamais de fetch réseau vers
 * notre propre API depuis le serveur) ; `BranchLocator` (Client Component)
 * reçoit ce résultat en `initialData` et ne recontacte `/api/branches` que
 * lorsque l'utilisateur cherche/filtre (§1 : toutes les données viennent de la
 * couche database/service/API, jamais codées en dur dans les composants).
 */
export default async function BranchesPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string }>;
}) {
  const [{ locale }, searchParams] = await Promise.all([props.params, props.searchParams]);
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const tDesign = await getTranslations("locator");
  const citySlug = searchParams.city?.trim() || null;
  const initialData = await getBranchLocatorData({
    locale: appLocale,
    ...(citySlug ? { citySlug } : {}),
  });

  return (
    <div className="locator-shell" data-design="orange-locator">
      <section className="locator-hero" aria-labelledby="locator-heading">
        <div className="locator-hero-inner">
          <div className="locator-hero-copy">
            <h1 id="locator-heading" className={appLocale === "he" ? hebrewHeading.className : undefined}>
              {tDesign("heroTitle")}
            </h1>
            <p>{tDesign("heroSubtitle")}</p>
          </div>
          <div className="locator-illustration"><StorefrontIllustration /></div>
        </div>
      </section>
      <div className="locator-content">
        <BranchLocator locale={appLocale} initialData={initialData} initialCitySlug={citySlug} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BranchLocator } from "@/components/branches/BranchLocator";
import { getBranchLocatorData } from "@/services/branch.service";
import { buildLocaleHreflangAlternates } from "@/lib/seo/branch-urls";
import type { AppLocale } from "@/types/i18n";

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

  const t = await getTranslations("branches");
  const citySlug = searchParams.city?.trim() || null;
  const initialData = await getBranchLocatorData({
    locale: appLocale,
    ...(citySlug ? { citySlug } : {}),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">

      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <BranchLocator
        locale={appLocale}
        initialData={initialData}
        initialCitySlug={citySlug}
      />
    </div>
  );
}

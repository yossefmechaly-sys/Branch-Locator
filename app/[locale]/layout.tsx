import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/lib/i18n/routing";
import { getDirection, locales, type AppLocale } from "@/types/i18n";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSiteUrl } from "@/lib/seo/site";
import "../globals.css";

// Pas de police web chargée à distance (`next/font/google`) : aucune police
// latine courante (Geist inclus) ne couvre nativement l'hébreu, et une police
// variable auto-hébergée avec un jeu de glyphes he/en/ru/fr/es sera introduite
// plus tard si besoin. La pile système ci-dessous (définie dans `globals.css`)
// couvre correctement les cinq langues sur toutes les plateformes, sans
// dépendance réseau ni bascule de police visible (FOUT) au chargement.

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    // Base de résolution des URLs relatives (images OG, favicon, etc.) pour
    // TOUTE la métadonnée de l'application (§27 Phase 8) — lue exclusivement
    // via `NEXT_PUBLIC_SITE_URL` (`lib/seo/site.ts`), jamais un domaine de
    // staging codé en dur. Les pages de fiche magasin construisent déjà leurs
    // propres URLs absolues (`lib/seo/metadata.ts`) et ne dépendent donc pas
    // de ce réglage, mais tout le reste de l'application (page d'accueil,
    // Store Locator) en profite pour ses métadonnées par défaut.
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: t("title"),
      template: `%s · ${t("title")}`,
    },
    description: t("description"),
    // hreflang complet (avec x-default) généré dynamiquement par page dans
    // `lib/seo/` à partir de la Phase 8 ; ce squelette couvre déjà le layout racine.
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout(
  props: LayoutProps<"/[locale]">
) {
  const { locale } = await props.params;

  // Filet de sécurité défensif : le proxy (`proxy.ts`) ne laisse en principe passer
  // que des locales valides, mais toute route atteinte autrement (rewrite, test)
  // doit échouer proprement plutôt que de rendre une page dans une locale inconnue.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Permet le rendu statique (ISR) des pages sous ce layout malgré l'usage de
  // `useTranslations` / `useLocale` côté serveur — cf. doc next-intl sur
  // `setRequestLocale`.
  setRequestLocale(locale);

  const direction = getDirection(locale as AppLocale);

  return (
    <html
      lang={locale}
      dir={direction}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex-1">{props.children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

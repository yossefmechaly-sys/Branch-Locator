import type { Metadata } from "next";

import type { AppLocale } from "@/types/i18n";
import { absoluteImageUrl } from "./site";
import { buildBranchHreflangAlternates, buildBranchUrl } from "./branch-urls";

/** Codes de locale Open Graph standard (`xx_XX`) — format attendu par
 * `og:locale` (Facebook/LinkedIn), distinct du code de langue applicatif
 * (`AppLocale`, `types/i18n.ts`) qui n'a pas de composante pays. */
const OPEN_GRAPH_LOCALE: Record<AppLocale, string> = {
  he: "he_IL",
  en: "en_US",
  ru: "ru_RU",
  fr: "fr_FR",
  es: "es_ES",
};

/** Image Open Graph générique (§28) — utilisée quand le magasin n'a aucune
 * photo (`mainImage` absent). Fichier statique local, jamais une image
 * générée dynamiquement dans cette phase (§28 : « sauf nécessité »). */
export const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

export interface BranchMetadataInput {
  locale: AppLocale;
  slug: string;
  /** `BranchTranslation.seoTitle` — prioritaire quand présent (§18). */
  seoTitle: string | null;
  /** `BranchTranslation.seoDescription` — prioritaire quand présente (§18). */
  seoDescription: string | null;
  /** `BranchTranslation.description` — repli si `seoDescription` est absente. */
  description: string | null;
  mainImage: string | null;
  /** Titre déjà construit par l'appelant (`generateMetadata`, via
   * `getTranslations()`) si `seoTitle` est absent — cette fonction reste pure
   * et synchrone, sans dépendance à next-intl (§39 : testable indépendamment). */
  fallbackTitle: string;
  fallbackDescription: string;
}

/**
 * Construit les métadonnées Next.js d'une fiche magasin (Phase 8, §18/§19/§20/§28) :
 * title/description (traductions DB en priorité, repli explicite sinon, §5),
 * canonical propre à CETTE langue (§19 — jamais toutes les langues vers
 * l'hébreu), hreflang complet avec `x-default` (§20), Open Graph + Twitter
 * avec repli image générique (§28). Fonction pure : aucun accès à `next-intl`,
 * `next/navigation` ni à la base de données — testable indépendamment de React
 * (§39), comme le reste des modules `lib/`.
 */
export function buildBranchMetadata(input: BranchMetadataInput): Metadata {
  const title = input.seoTitle ?? input.fallbackTitle;
  const description = input.seoDescription ?? input.description ?? input.fallbackDescription;
  const canonical = buildBranchUrl(input.locale, input.slug);
  const imageUrl = absoluteImageUrl(input.mainImage ?? DEFAULT_OG_IMAGE_PATH);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildBranchHreflangAlternates(input.slug),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "Maayan 2000",
      locale: OPEN_GRAPH_LOCALE[input.locale],
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

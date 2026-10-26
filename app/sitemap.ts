import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";
import {
  buildBranchUrl,
  buildBranchHreflangAlternates,
  buildLocaleHreflangAlternates,
} from "@/lib/seo/branch-urls";
import { getBranchLocatorData } from "@/services/branch.service";
import { locales, defaultLocale } from "@/types/i18n";

/**
 * Sitemap XML (Phase 8, §25) — régénéré au maximum toutes les heures : le
 * contenu qu'il référence (liste de magasins actifs, pages de fiches) change
 * rarement, contrairement au statut « ouvert maintenant » d'une fiche donnée
 * (§34) — cette page n'affiche d'ailleurs elle-même AUCUN horaire, seulement
 * des URLs, donc la contrainte de fraîcheur « jamais des heures » de §34 ne
 * s'applique pas ici.
 */
export const revalidate = 3600;

/**
 * Une entrée par COUPLE (magasin, langue) plutôt qu'une seule URL "générique"
 * par magasin (§25) — chaque langue a sa propre URL canonique indexable
 * (§19), et `alternates.languages` (réutilise EXACTEMENT
 * `buildBranchHreflangAlternates()`, §20 — jamais reconstruit ici) signale
 * explicitement aux moteurs de recherche que ces cinq URLs sont les
 * traductions d'une même page, évitant tout risque de contenu dupliqué.
 *
 * `getBranchLocatorData({ locale: defaultLocale })` (Phase 4, réutilisée telle
 * quelle) suffit à connaître tous les `slug` actifs : le `slug` est stable
 * d'une langue à l'autre (§6), la langue de récupération n'a donc aucune
 * importance ici — seuls les `slug` sont utilisés, jamais les noms localisés.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const { branches } = await getBranchLocatorData({ locale: defaultLocale });
  const now = new Date();

  // Phase 11, §16 (correctif défaut réel, audit SEO) : `alternates.languages`
  // ajouté ici pour rester cohérent avec `branchEntries` ci-dessous, qui le
  // fait déjà — rien ne justifiait cette asymétrie.
  const localeHomeAlternates = buildLocaleHreflangAlternates("/branches");
  const localeHomeEntries: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${siteUrl}/${locale}/branches`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
    alternates: {
      languages: localeHomeAlternates,
    },
  }));

  const branchEntries: MetadataRoute.Sitemap = branches.flatMap((branch) =>
    locales.map((locale) => ({
      url: buildBranchUrl(locale, branch.slug),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
      alternates: {
        languages: buildBranchHreflangAlternates(branch.slug),
      },
    }))
  );

  return [...localeHomeEntries, ...branchEntries];
}

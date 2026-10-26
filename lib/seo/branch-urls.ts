import { locales, defaultLocale, type AppLocale } from "@/types/i18n";
import { getSiteUrl } from "./site";

/**
 * Construction d'URLs de fiche magasin (Phase 8, §6/§19/§20) — SEUL endroit de
 * l'application qui assemble le chemin `/{locale}/branches/{slug}`. Le `slug`
 * reste identique d'une langue à l'autre (§6) : ces fonctions ne font que
 * préfixer la locale, jamais traduire ni modifier le `slug` lui-même.
 */

/** Chemin relatif (`/he/branches/jerusalem-ramot`) — sans domaine. */
export function buildBranchPath(locale: AppLocale, slug: string): string {
  return `/${locale}/branches/${slug}`;
}

/** URL absolue (`https://exemple.com/he/branches/jerusalem-ramot`) — utilisée
 * pour le canonical, Open Graph, et le JSON-LD (§18/§19/§21). */
export function buildBranchUrl(locale: AppLocale, slug: string): string {
  return `${getSiteUrl()}${buildBranchPath(locale, slug)}`;
}

/**
 * Alternatives `hreflang` pour une fiche magasin (§20) : une entrée par
 * langue supportée + `x-default` pointant vers la version hébraïque (langue
 * de référence de l'application, §5/§20 — jamais une autre langue par
 * défaut). Clés au format attendu par `Metadata.alternates.languages`
 * (Next.js) : `{ he: "...", en: "...", ..., "x-default": "..." }`.
 */
export function buildBranchHreflangAlternates(slug: string): Record<string, string> {
  const entries = locales.map((locale) => [locale, buildBranchUrl(locale, slug)] as const);
  return {
    ...Object.fromEntries(entries),
    "x-default": buildBranchUrl(defaultLocale, slug),
  };
}

/**
 * Alternatives `hreflang` pour une page localisée QUELCONQUE en dehors d'une
 * fiche magasin (Phase 11, §16 — correctif d'un vrai défaut trouvé pendant
 * l'audit SEO) : `pathWithoutLocale` est le chemin SANS préfixe de langue
 * (`/branches`, `/`), auquel chaque locale est préfixée à son tour, avec
 * `x-default` pointant vers la version hébraïque — même règle que
 * `buildBranchHreflangAlternates()` ci-dessus, généralisée.
 *
 * Avant ce correctif, la page Store Locator (`/[locale]/branches`) n'avait
 * AUCUNE métadonnée `alternates` propre et héritait donc de celle du layout
 * racine (`{ he: "/he", en: "/en", ... }`, sans `x-default`) — des chemins
 * incorrects (pointant vers la redirection `/he`, pas `/he/branches`) qui
 * contredisaient le header `Link` du middleware next-intl, correct lui, pour
 * cette même page.
 */
export function buildLocaleHreflangAlternates(pathWithoutLocale: string): Record<string, string> {
  const siteUrl = getSiteUrl();
  const entries = locales.map(
    (locale) => [locale, `${siteUrl}/${locale}${pathWithoutLocale}`] as const
  );
  return {
    ...Object.fromEntries(entries),
    "x-default": `${siteUrl}/${defaultLocale}${pathWithoutLocale}`,
  };
}

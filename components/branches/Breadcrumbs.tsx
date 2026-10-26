import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { Link } from "@/lib/i18n/navigation";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import type { AppLocale } from "@/types/i18n";

export interface BreadcrumbsProps {
  locale: AppLocale;
  cityName: string;
  citySlug: string;
  branchDisplayName: string;
  /** URLs absolues déjà construites par la page (§16/§31 — jamais assemblées ici). */
  homeUrl: string;
  branchesUrl: string;
}

/**
 * Fil d'Ariane (Phase 8, §31) : Accueil → Magasins → Ville → Magasin. Server
 * Component pur — aucune interactivité, uniquement des `Link` (navigation
 * consciente de la locale, §6) et le JSON-LD `BreadcrumbList` correspondant,
 * émis ICI plutôt que dans la page pour que le balisage et le contenu visible
 * restent définis au même endroit (jamais deux sources de vérité qui
 * pourraient diverger). La ville pointe vers le Store Locator avec son
 * `citySlug` en query string afin d'afficher directement les magasins de cette ville.
 */
export function Breadcrumbs({ locale, cityName, citySlug, branchDisplayName, homeUrl, branchesUrl }: BreadcrumbsProps) {
  const t = useTranslations("breadcrumbs");

  const items = [
    { name: t("home"), url: homeUrl },
    { name: t("branches"), url: branchesUrl },
    { name: cityName, url: `${branchesUrl}?city=${encodeURIComponent(citySlug)}` },
    { name: branchDisplayName, url: null },
  ];

  return (
    <nav aria-label={t("branches")} className="text-sm text-muted-foreground">
      <JsonLd data={buildBreadcrumbSchema(items)} />
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/branches" locale={locale} className="hover:text-foreground hover:underline">
            {t("home")}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5 rtl:rotate-180" />
        </li>
        <li>
          <Link href="/branches" locale={locale} className="hover:text-foreground hover:underline">
            {t("branches")}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5 rtl:rotate-180" />
        </li>
        <li>
          <Link
            href={{ pathname: "/branches", query: { city: citySlug } }}
            locale={locale}
            className="hover:text-foreground hover:underline"
          >
            {cityName}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5 rtl:rotate-180" />
        </li>
        <li aria-current="page" className="font-medium text-foreground">
          {branchDisplayName}
        </li>
      </ol>
    </nav>
  );
}

import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/**
 * 404 dédié à `/[locale]/branches/[slug]` (Phase 8, §1/§37) — déclenché par
 * `notFound()` dans `page.tsx`, aussi bien pour un `slug` inexistant que pour
 * un magasin désactivé (§35 : les deux cas restent indiscernables jusqu'ici).
 *
 * `not-found.js` ne reçoit AUCUNE prop (y compris `params`, doc Next.js) —
 * mais la locale de la requête reste résolue correctement par next-intl
 * (`getRequestConfig`/`setRequestLocale`, appelés plus haut dans l'arbre pour
 * cette même requête, avant que `notFound()` ne soit levé) : `getTranslations()`
 * et `<Link>` (sans `locale` explicite) retombent donc naturellement sur la
 * bonne langue, sans avoir besoin du paramètre d'URL ici.
 *
 * `generateMetadata()` propre (§35/§37) : sans cela, `<title>` retomberait sur
 * le titre par défaut du layout racine (`generateMetadata()` de `page.tsx`
 * retourne `{}` pour un magasin introuvable) — un onglet « Fiche magasin
 * introuvable » est plus clair qu'un titre générique de site sur une page
 * d'erreur. Next.js force déjà `noindex` sur toute réponse 404 (§35).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("branchDetail.notFound");
  return { title: t("title") };
}

export default async function BranchNotFound() {
  const t = await getTranslations("branchDetail.notFound");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button asChild>
        <Link href="/branches">{t("cta")}</Link>
      </Button>
    </div>
  );
}

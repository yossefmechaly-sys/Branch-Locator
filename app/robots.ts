import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";

/**
 * `robots.txt` (Phase 8, §26) — bloque UNIQUEMENT `/admin` (back-office prévu
 * Phase 9, absent de cette phase mais son chemin est déjà réservé), rien
 * d'autre : toutes les fiches magasin et le Store Locator restent indexables.
 * `sitemap` pointe vers `app/sitemap.ts`, construite avec la même
 * `NEXT_PUBLIC_SITE_URL` que le reste du SEO (§27) — jamais un domaine codé
 * en dur.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

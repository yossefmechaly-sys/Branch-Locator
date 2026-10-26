import { revalidatePath } from "next/cache";

import { locales } from "@/types/i18n";

/**
 * Invalidation CIBLÉE du cache public après une mutation admin (Phase 9,
 * §20) — appelée par CHAQUE service de mutation (`branch-admin.service.ts`,
 * `promotion-admin.service.ts`) immédiatement après une écriture réussie,
 * jamais en comptant simplement sur la fenêtre ISR de 60 secondes déjà en
 * place (§20, impératif : « ne pas compter simplement sur l'ISR »).
 *
 * `revalidatePath()` plutôt que des tags de cache : les pages concernées
 * (`/[locale]/branches`, `/[locale]/branches/[slug]`) ne posent aujourd'hui
 * aucun `fetch()` avec tag, seulement des appels directs à
 * `services/branch.service.ts` — `revalidatePath` est donc le mécanisme
 * Next.js qui s'applique sans changement d'architecture de la couche
 * données existante (Phases 3-8), cohérent avec « sans refactor inutile des
 * Phases 3-8 » demandé en ouverture de cette phase.
 */
export function invalidatePublicBranchCaches(affectedBranchSlugs: readonly string[] = []): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}/branches`);
    for (const slug of affectedBranchSlugs) {
      revalidatePath(`/${locale}/branches/${slug}`);
    }
  }
  // Le sitemap ne liste que des URLs (jamais d'horaires/prix, voir
  // `app/sitemap.ts`) — seule sa présence/absence pour un magasin
  // désactivé/réactivé (§21) justifie de l'invalider ici aussi.
  revalidatePath("/sitemap.xml");
}

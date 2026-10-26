/**
 * Domaine de production (Phase 8, §27) — LU EXCLUSIVEMENT depuis
 * `NEXT_PUBLIC_SITE_URL` (voir `.env.example`), jamais un domaine codé en dur
 * dans le code applicatif. Le repli `http://localhost:3000` ci-dessous n'est
 * PAS un domaine de staging : c'est le port par défaut de `next dev`, utilisé
 * uniquement quand la variable est absente (développement local sans fichier
 * `.env`) — en production, `NEXT_PUBLIC_SITE_URL` DOIT être définie (voir la
 * documentation ajoutée à `.env.example`) ; ce repli garantit seulement que
 * `next build`/les tests ne plantent jamais faute de variable.
 */
const DEV_FALLBACK_SITE_URL = "http://localhost:3000";

/** Retourne l'URL du site SANS slash final (`https://exemple.com`, jamais
 * `https://exemple.com/`) — chaque appelant (`lib/seo/*`) compose ensuite ses
 * propres chemins avec un `/` explicite, jamais de double slash. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const raw = configured && configured.length > 0 ? configured : DEV_FALLBACK_SITE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/**
 * Rend absolue une URL d'image potentiellement relative (`BranchImage`,
 * `Branch.mainImage`, `Promotion.image` — toutes stockées en base comme des
 * chemins relatifs, ex. `/demo/branches/jerusalem-ramot.jpg`) — nécessaire
 * partout où cette image quitte le contexte de l'application (Open Graph,
 * JSON-LD Schema.org, §21/§28) : ces deux contextes exigent une URL absolue,
 * jamais un chemin relatif au domaine courant. SEUL endroit de
 * `lib/seo/` qui fait cette conversion — `lib/seo/metadata.ts` et
 * `lib/seo/schema.ts` la réutilisent tous deux, jamais une seconde
 * implémentation.
 */
export function absoluteImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${getSiteUrl()}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

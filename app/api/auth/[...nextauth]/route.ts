import { handlers } from "@/lib/auth";

/**
 * Route handler Auth.js (Phase 9, §1) — délègue entièrement à `handlers`
 * (`lib/auth/index.ts`). `/api/auth/**` est en dehors du périmètre `/admin`
 * mais reste implicitement non indexable (aucune page HTML, jamais listé
 * dans le sitemap) ; `robots.ts` continue par ailleurs de bloquer `/admin`.
 */
export const { GET, POST } = handlers;

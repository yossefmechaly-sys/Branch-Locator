import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";

import { routing } from "@/lib/i18n/routing";
import { usesSecureSessionCookie } from "@/lib/auth/session-cookie";

/**
 * Proxy unique du projet (Next.js 16 a renommé `middleware.ts` en `proxy.ts`
 * — un seul fichier, une seule fonction exportée, voir la note de migration
 * du README). Il combine deux responsabilités indépendantes :
 *
 * 1. Résolution de la locale publique (`/[locale]/**`, Phase 4) — déléguée
 *    tel quel à `createIntlMiddleware(routing)`, jamais réimplémentée ici.
 * 2. Garde d'authentification `/admin/**` (Phase 9, §1) — `/admin` n'est PAS
 *    sous `/[locale]`, donc le middleware next-intl (`localePrefix:
 *    "always"`) le redirigerait à tort vers `/he/admin` s'il le traitait :
 *    les chemins `/admin*` sont donc interceptés AVANT d'atteindre
 *    `createIntlMiddleware`, jamais transmis à celui-ci.
 *
 * Garde LÉGÈRE et de confort de navigation uniquement (redirection vers
 * `/admin/login` si aucun cookie de session valide) — ce n'est PAS la seule
 * protection : chaque page/layout admin appelle `requireAdminSession()`
 * et chaque Server Action `requireMutationPermission()`
 * (`lib/auth/require.ts`), qui restent la garantie réelle même si ce fichier,
 * son `matcher`, ou un futur refactor de route l'excluait par erreur — voir
 * l'avertissement officiel de Next.js 16 : « Always verify authentication
 * and authorization inside each Server Function rather than relying on
 * Proxy alone. »
 */
const intlProxy = createIntlMiddleware(routing);

/** Seule page `/admin/**` accessible SANS session (le formulaire de
 * connexion lui-même — sans quoi personne ne pourrait jamais se connecter). */
const ADMIN_PUBLIC_PATHS = new Set<string>(["/admin/login"]);

async function handleAdminProxy(request: NextRequest, pathname: string): Promise<NextResponse> {
  if (ADMIN_PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: usesSecureSessionCookie(
      request.url,
      request.headers.get("x-forwarded-proto"),
      process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
    ),
  });
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin") loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return handleAdminProxy(request, pathname);
  }

  return intlProxy(request);
}

export const config = {
  // Exclut les fichiers statiques, les assets Next.js et les routes API du
  // périmètre de ce proxy — `/api/admin/**` reste protégé indépendamment par
  // `requireMutationPermission()` dans chaque Server Action (§19), jamais par
  // ce matcher (voir l'avertissement Next.js 16 cité ci-dessus).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

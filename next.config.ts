import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

/**
 * En-têtes de sécurité globaux (Phase 11, §19/§21 — durcissement production).
 * Aucun en-tête ici ne dépend du contenu de la page (jamais de logique
 * métier) : appliqués à TOUTES les routes, public ET `/admin`.
 *
 * Volontairement PAS de `Content-Security-Policy` ici : une CSP correcte
 * doit autoriser explicitement `maps.googleapis.com`/`maps.gstatic.com`
 * (chargement du script Google Maps, §5), l'éventuel domaine de stockage des
 * photos (`images.remotePatterns` ci-dessous), et les styles inline que
 * Next.js/Tailwind peuvent injecter — une CSP mal calibrée casserait la carte
 * ou les styles sans avertissement clair. Cet environnement ne permet pas de
 * vérifier une CSP contre l'application réellement démarrée (voir le rapport
 * final Phase 11, Prisma Client non généré) ; l'ajouter à l'aveugle irait
 * contre la consigne de ne jamais dégrader une fonctionnalité pour cocher une
 * case de sécurité. Documentée comme recommandation de suivi dans
 * `docs/production-deployment.md`, à calibrer et tester avec l'application
 * réellement démarrée avant activation.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com",
  "connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  // Empêche le navigateur de deviner un type MIME différent de celui déclaré
  // (protection contre certaines classes d'attaque par upload de fichier).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Interdit l'intégration de TOUTE page du site dans une <iframe> tierce
  // (clickjacking) — y compris `/admin`, qui n'a par nature aucune raison
  // d'être encadrée (§19).
  { key: "X-Frame-Options", value: "DENY" },
  // N'envoie l'URL complète en Referer qu'aux requêtes de même origine ;
  // seule l'origine (jamais le chemin) part vers un site tiers.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive par défaut les capteurs sensibles qu'aucune page de ce projet
  // n'utilise (caméra/micro/paiement) ; la géolocalisation RESTE autorisée en
  // `self` (§ Phase 6 : "Me localiser" a besoin de `navigator.geolocation`
  // côté client, jamais bloquée par erreur ici).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  // Retire l'en-tête `X-Powered-By: Next.js` (envoyé par défaut) — évite de
  // révéler gratuitement le framework/la version au client (Phase 11, §21).
  poweredByHeader: false,
  // Phase 11 (checklist déploiement, voir `docs/production-deployment.md` §3
  // et `Dockerfile`) : sortie de build autonome — `.next/standalone` embarque
  // un serveur Node minimal + uniquement les dépendances de production
  // réellement utilisées (trace de dépendances automatique), sans avoir à
  // copier tout `node_modules` dans l'image finale. Purement une option de
  // build ; aucun changement de comportement en développement (`next dev`
  // l'ignore).
  output: "standalone",
  images: {
    // Complété en Phase 5/8 avec le(s) domaine(s) réel(s) de stockage des photos
    // de magasins (voir `BranchImage.imageUrl`, `BranchImage`, Phase 3/9).
    remotePatterns: [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);

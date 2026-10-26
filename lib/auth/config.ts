import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

import { prismaAdminUserRepository } from "@/services/admin-user.repository.prisma";
import { clearLoginFailures } from "@/lib/auth/login-rate-limit";

/**
 * Configuration Auth.js / NextAuth pour `/admin` (Phase 9, §1).
 *
 * - Stratégie JWT (pas d'adaptateur base de données) : `AdminUser` reste géré
 *   par sa propre couche repository (`services/admin-user.repository.*`,
 *   même découpage que `BranchRepository`) — Auth.js n'a besoin d'aucune
 *   table `Session`/`Account` supplémentaire, et n'importe donc jamais de
 *   type généré par `prisma generate` (indisponible dans ce bac à sable).
 * - `trustHost: true` : déploiement auto-hébergé (Node.js/Docker, jamais
 *   Vercel — voir `next.config.ts`), donc pas de détection d'hôte via une
 *   plateforme connue ; l'hôte de la requête entrante fait foi.
 * - Aucun provider OAuth, AUCUNE route de signup : la SEULE façon de créer un
 *   `AdminUser` est une opération manuelle/`seed` côté serveur (§1 : « aucun
 *   signup public »).
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  // Phase 11, §16 (correctif défaut réel, audit auth/session) : `maxAge`
  // explicite plutôt que le défaut Auth.js (30 jours) — trop long pour une
  // session de back-office administratif (§1). 12h, renouvelée à chaque
  // requête active (`updateAge`, défaut Auth.js déjà à 24h — abaissé ici en
  // cohérence avec le nouveau `maxAge`) : une session inactive expire dans la
  // même journée de travail, sans forcer une reconnexion en pleine séance.
  session: { strategy: "jwt", maxAge: 12 * 60 * 60, updateAge: 60 * 60 },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prismaAdminUserRepository.findByEmail(email);
        // Message d'échec IDENTIQUE que l'email soit inconnu, le compte
        // inactif, ou le mot de passe invalide (§1/§24 : ne jamais révéler
        // par le comportement si un email existe en base).
        if (!user || !user.isActive) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) return null;

        await prismaAdminUserRepository.touchLastLogin(user.id);

        // Une authentification réussie remet à zéro les échecs précédents
        // associés à cette adresse e-mail.
        clearLoginFailures(email);

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` n'est présent qu'au moment de la connexion (§ Auth.js) — le
      // reste du temps, le token précédent est reconduit tel quel.
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

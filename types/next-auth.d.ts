import type { AdminRole } from "@/types/admin";

/**
 * Augmentation des types Auth.js (Phase 9, §1) — ajoute `id`/`role` à
 * `Session.user` et au `JWT`, pour que tout code serveur qui lit
 * `session.user.role` soit typé correctement plutôt que `any`. Ce fichier ne
 * contient aucune logique, uniquement des déclarations de types.
 */
declare module "next-auth" {
  interface User {
    role: AdminRole;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: AdminRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AdminRole;
  }
}

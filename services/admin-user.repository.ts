import type { AdminRole } from "@/types/admin";

/**
 * Couche « récupération des données » pour l'authentification admin — même
 * principe que `services/branch.repository.ts` (Phase 4, §7) : une interface
 * découplée de Prisma, pour que `lib/auth/config.ts` (l'`authorize()` de
 * Credentials) reste testable sans base de données réelle.
 */
export interface RawAdminUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface AdminUserRepository {
  findByEmail(email: string): Promise<RawAdminUser | null>;
  findById(id: string): Promise<RawAdminUser | null>;
  /** Horodate la dernière connexion réussie — jamais appelé sur un échec
   * d'authentification (mot de passe invalide, compte inactif). */
  touchLastLogin(id: string): Promise<void>;
}

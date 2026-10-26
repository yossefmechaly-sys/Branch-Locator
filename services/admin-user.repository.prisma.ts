import { prisma } from "@/lib/prisma";
import type { AdminRole } from "@/types/admin";

import type { AdminUserRepository, RawAdminUser } from "./admin-user.repository";

/**
 * Implémentation Prisma de `AdminUserRepository` — même convention que
 * `services/branch.repository.prisma.ts` (Phase 4/9) : forme de ligne
 * déclarée à la main tant que `prisma generate` reste indisponible dans ce
 * bac à sable (réseau bloqué, voir Phase 3). Fonctionne sans modification une
 * fois la génération effectuée chez l'utilisateur.
 */
interface PrismaAdminUserRow {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  updatedAt: Date;
}

function mapRow(row: PrismaAdminUserRow): RawAdminUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role as AdminRole,
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const prismaAdminUserRepository: AdminUserRepository = {
  async findByEmail(email) {
    const row = (await prisma.adminUser.findUnique({
      where: { email },
    })) as PrismaAdminUserRow | null;
    return row ? mapRow(row) : null;
  },

  async findById(id) {
    const row = (await prisma.adminUser.findUnique({
      where: { id },
    })) as PrismaAdminUserRow | null;
    return row ? mapRow(row) : null;
  },

  async touchLastLogin(id) {
    await prisma.adminUser.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};

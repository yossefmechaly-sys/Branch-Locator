import { prisma } from "@/lib/prisma";
import type { AdminSessionUser } from "@/types/admin";

/**
 * Écriture du journal d'audit (Phase 9, §18) — SEULE fonction du back-office
 * autorisée à écrire dans `AuditLog` ; chaque service de mutation
 * (`branch-admin.service.ts`, `promotion-admin.service.ts`, …) l'appelle
 * APRÈS une écriture réussie, jamais avant (on ne trace pas une tentative
 * qui pourrait échouer ensuite). Ne lève jamais : un échec d'écriture du
 * journal ne doit JAMAIS faire échouer la mutation métier elle-même
 * (dégradation silencieuse, juste consignée en console).
 */
export type AuditEntityType = "Branch" | "Promotion" | "Service" | "City";

export async function recordAudit(
  actor: AdminSessionUser,
  action: string,
  entityType: AuditEntityType,
  entityId: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action,
        entityType,
        entityId,
      },
    });
  } catch (error) {
    console.error("[audit] échec d'écriture (mutation déjà appliquée, non bloquant) :", error);
  }
}

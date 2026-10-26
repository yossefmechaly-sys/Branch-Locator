-- Phase 9 — Back-office d'administration, §18/§27.
--
-- Migration ADDITIVE et INDÉPENDANTE : n'altère ni ne recrée AUCUNE table
-- existante, en particulier ne touche pas à la migration
-- "20260830010000_promotion_pricing" (§27 : « toute nouvelle évolution de
-- schéma doit avoir une nouvelle migration », jamais une modification
-- rétroactive d'une migration déjà livrée). `AdminUser`/`AdminRole`
-- existent déjà depuis "20260830000000_init" et ne sont pas touchés ici.

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

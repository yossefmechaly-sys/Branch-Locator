-- Phase 10 — Analytics interne, §1/§3/§15/§19/§46.
--
-- Migration ADDITIVE et INDÉPENDANTE : n'altère ni ne recrée AUCUNE table
-- existante, en particulier ne touche pas aux migrations déjà livrées
-- ("20260830000000_init", "20260830010000_promotion_pricing",
-- "20260831000000_admin_audit_log"). La colonne historique
-- "analytics_events"."query" n'est PAS supprimée (aucune suppression
-- rétroactive de colonne) — simplement plus jamais écrite par le nouveau
-- pipeline (§4 : minimisation de la vie privée, voir le commentaire du
-- modèle `AnalyticsEvent` dans schema.prisma).

-- AlterEnum
ALTER TYPE "AnalyticsEventType" ADD VALUE 'LOCATOR_VIEW';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'BRANCH_CARD_CLICK';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'MAP_MARKER_CLICK';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'PROMOTION_VIEW';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'PROMOTION_CLICK';

-- AlterTable
ALTER TABLE "analytics_events" ADD COLUMN "promotionId" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "analytics_events_promotionId_idx" ON "analytics_events"("promotionId");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

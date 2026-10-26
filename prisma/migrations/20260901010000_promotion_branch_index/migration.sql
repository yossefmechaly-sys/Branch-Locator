-- Phase 11, §16 (audit index) — voir le commentaire détaillé dans
-- prisma/schema.prisma sur PromotionBranch. Ajoute l'index manquant
-- démontré par l'audit de performance : la PK composite (promotionId,
-- branchId) est inutilisable pour une recherche par branchId seul, et
-- loadPromotionsForBranches() (chemin public le plus chaud) en dépend.
CREATE INDEX "promotion_branches_branchId_idx" ON "promotion_branches"("branchId");

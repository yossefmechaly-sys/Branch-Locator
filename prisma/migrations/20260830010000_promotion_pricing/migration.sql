-- Phase 9 — Promotions structurées (produit + prix), §1/§2/§3/§4/§21.
--
-- Migration ADDITIVE : n'altère AUCUNE table ni colonne existante en dehors
-- de "promotions"/"promotion_translations", et ne casse aucune donnée déjà
-- en base (§21, §24). Les 3 lignes DEMO créées par la migration
-- "20260830000000_init" (voir prisma/seed.ts#seedPromotions()) n'ont pas
-- encore de colonne "slug" : cette migration l'ajoute d'abord nullable, la
-- renseigne explicitement pour ces 3 lignes connues (identifiées par leur
-- "image", seule clé stable qu'elles possédaient jusqu'ici), comble tout
-- résidu éventuel avec une valeur déterministe de repli, PUIS seulement
-- applique la contrainte NOT NULL + UNIQUE — jamais l'inverse, qui casserait
-- toute ligne préexistante sans valeur.

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ILS');

-- CreateEnum
CREATE TYPE "PromotionUnit" AS ENUM ('UNIT', 'KG', 'GRAM', 'LITER', 'ML', 'PACK', 'BOX');

-- AlterTable: nouvelles colonnes de tarification structurée sur "promotions"
-- (§1/§2/§3/§4/§5/§8/§10/§22). "slug" reste nullable à ce stade — voir le
-- backfill ci-dessous avant l'ajout de la contrainte NOT NULL.
ALTER TABLE "promotions"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "price" DECIMAL(10,2),
  ADD COLUMN "originalPrice" DECIMAL(10,2),
  ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'ILS',
  ADD COLUMN "unit" "PromotionUnit" NOT NULL DEFAULT 'UNIT',
  ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: nom de produit traduit (§1/§11) — distinct de "title", voir
-- prisma/schema.prisma. Nullable : une promotion éditoriale sans produit
-- structuré n'a pas besoin de "productName" (même cas que "price" ci-dessus).
ALTER TABLE "promotion_translations"
  ADD COLUMN "productName" TEXT;

-- Backfill des 3 promotions DEMO déjà connues (prisma/seed-data.ts) —
-- identifiées par leur "image", qui était jusqu'ici leur seule clé stable
-- pour un ré-exécution idempotente du seed (voir l'ancien
-- prisma/seed.ts#seedPromotions()). Valeurs alignées avec les nouveaux
-- "slug" du seed (prisma/seed-data.ts#PROMOTIONS) — un redéploiement à
-- partir d'une base déjà seedée retrouve donc exactement les mêmes lignes
-- par "slug" au prochain `npx prisma db seed`, sans duplication.
UPDATE "promotions" SET "slug" = 'back-to-school-2026'
  WHERE "image" = '/demo/promotions/back-to-school.jpg' AND "slug" IS NULL;
UPDATE "promotions" SET "slug" = 'jerusalem-grand-opening'
  WHERE "image" = '/demo/promotions/grand-opening-jerusalem.jpg' AND "slug" IS NULL;
UPDATE "promotions" SET "slug" = 'rosh-hashanah-2026'
  WHERE "image" = '/demo/promotions/rosh-hashanah.jpg' AND "slug" IS NULL;

-- Filet de sécurité défensif : toute autre ligne préexistante non couverte
-- par les 3 cas ci-dessus (environnement où d'autres promotions auraient été
-- créées manuellement avant cette migration) reçoit un slug déterministe
-- dérivé de son "id" plutôt que de bloquer la migration — jamais de valeur
-- devinée pour son contenu, seulement un identifiant technique de repli.
UPDATE "promotions" SET "slug" = 'promotion-' || "id" WHERE "slug" IS NULL;

-- Seulement maintenant : la contrainte NOT NULL + UNIQUE, une fois que
-- TOUTE ligne existante a une valeur.
ALTER TABLE "promotions" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "promotions_slug_key" ON "promotions"("slug");

-- CreateIndex: tri "promotion du jour" (§8/§10) — promotions featured
-- triées par priorité, sans scanner la table entière.
CREATE INDEX "promotions_isFeatured_priority_idx" ON "promotions"("isFeatured", "priority");

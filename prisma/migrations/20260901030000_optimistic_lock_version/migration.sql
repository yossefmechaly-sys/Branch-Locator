-- Phase 11, §16ter (durcissement de la concurrence optimiste) — remplace le
-- verrou basé sur `updatedAt` (millisecondes, comparaison d'égalité de date)
-- par un compteur entier explicite `version`, SEULE source de vérité pour la
-- détection de conflit d'édition (§17) sur les 4 entités CRUD admin.
--
-- Additive et non destructive : AJOUTE uniquement une colonne, ne supprime,
-- ne renomme, ne recrée AUCUNE table existante. `DEFAULT 1` initialise
-- DÉTERMINISTIQUEMENT toutes les lignes déjà présentes (y compris une base
-- Phase 10 déjà peuplée en production/démo) à la version 1, exactement comme
-- une entité tout juste créée après cette migration — aucune ligne existante
-- ne se retrouve dans un état distinguable d'une nouvelle création. `NOT
-- NULL` dès la création de la colonne : Postgres calcule le défaut pour
-- CHAQUE ligne existante avant de poser la contrainte, donc aucune ligne ne
-- reste `NULL` à aucun moment, même sur une table déjà volumineuse.
ALTER TABLE "branches" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "promotions" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "services" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "cities" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

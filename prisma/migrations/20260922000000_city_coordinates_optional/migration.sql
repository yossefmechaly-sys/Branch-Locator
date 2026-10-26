-- Les coordonnées géographiques d'une ville sont facultatives.
-- Les coordonnées des magasins (branches) restent obligatoires.
ALTER TABLE "cities"
    ALTER COLUMN "latitude" DROP NOT NULL,
    ALTER COLUMN "longitude" DROP NOT NULL;

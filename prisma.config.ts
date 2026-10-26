import { defineConfig, env } from "prisma/config";

// Prisma 7 a retiré le chargement automatique de `.env` (contrairement aux
// versions précédentes) : `env("DATABASE_URL")` ci-dessous échoue sinon avec
// `PrismaConfigEnvError`, y compris quand `.env` existe et contient bien la
// variable — la CLI Prisma (processus Node séparé de `next dev`, qui lui
// charge `.env` par son propre mécanisme) ne la voit simplement jamais
// chargée. `process.loadEnvFile()` (stable depuis Node 20.6, Node 22 ici) est
// l'équivalent natif de `dotenv.config()`, sans dépendance supplémentaire.
// Correction de configuration standard Prisma 7, sans rapport avec le
// blocage réseau `binaries.prisma.sh` déjà documenté (§26) — n'ajoute ni ne
// contourne rien côté sandbox.
try {
  process.loadEnvFile();
} catch {
  // `.env` absent (ex. environnement où les variables sont déjà injectées
  // autrement) — jamais bloquant, `env()` ci-dessous lèvera une erreur
  // explicite si `DATABASE_URL` reste malgré tout indéfinie.
}

/**
 * Configuration Prisma 7 (remplace la clé `"prisma"` de `package.json`,
 * dépréciée). Consommée par toutes les commandes `prisma migrate`/`db seed`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

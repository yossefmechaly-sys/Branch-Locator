import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright (Phase 9, §28) — suite E2E PERMANENTE, contrairement
 * aux passes de vérification des phases précédentes (créées puis intégralement
 * supprimées après vérification manuelle) : ces fichiers restent dans le dépôt
 * et doivent continuer à passer aux phases suivantes.
 *
 * Un seul projet Chromium (§28 ne demande pas de matrice multi-navigateurs ;
 * Chromium est déjà pré-installé dans les environnements CI/sandbox de ce
 * projet — voir le commentaire `webServer` plus bas — donc aucun téléchargement
 * de navigateur supplémentaire n'est nécessaire pour exécuter cette suite).
 *
 * `webServer` démarre `next start` contre une base déjà migrée/seedée (voir
 * `tests/e2e/README.md` pour la procédure complète) plutôt que `next dev`, pour
 * un comportement plus proche de la production et un démarrage plus
 * déterministe. Cette configuration suppose donc `npm run build` déjà exécuté.
 *
 * IMPORTANT (voir le rapport final, §26/§28) : dans le bac à sable de
 * développement utilisé pour écrire cette suite, `prisma generate` est bloqué
 * par le réseau (voir `prisma.config.ts`/rapport final) et aucune instance
 * PostgreSQL locale n'est démarrée — l'application ne peut donc pas
 * réellement démarrer dans CET environnement, et cette suite n'a PAS pu être
 * exécutée de bout en bout ici. Elle est écrite pour tourner dans un
 * environnement normal (CI ou poste de développement) disposant d'une base
 * migrée/seedée et d'un client Prisma généré.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Désactivé par défaut (E2E_START_SERVER non défini) : dans ce bac à sable,
  // `next start` échouerait immédiatement (pas de client Prisma généré, pas
  // de PostgreSQL démarré — voir le commentaire de tête). Dans un
  // environnement normal, exporter `E2E_START_SERVER=1` (après `npm run
  // build` et une base migrée/seedée) active le démarrage automatique du
  // serveur avant la suite.
  webServer: process.env.E2E_START_SERVER
    ? {
        command: "npm run start",
        url: process.env.E2E_BASE_URL ?? "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});

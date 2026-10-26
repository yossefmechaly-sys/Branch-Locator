import { expect, test } from "@playwright/test";

import { loginAsSuperAdmin } from "./helpers/auth";

/**
 * Parcours Analytics (Phase 10, §44/priorité #8 de l'utilisateur) — suite E2E
 * PERMANENTE au même titre que `admin-full-journey.spec.ts` (Phase 9, §28) :
 * ce fichier reste dans le dépôt et continue d'être exécuté aux phases
 * suivantes, jamais supprimé après vérification.
 *
 * Couvre le parcours demandé dans l'ordre : générer des événements publics →
 * connexion admin → ouvrir Analytics → vérifier les KPI → filtrer par
 * magasin → exporter.
 *
 * Magasin utilisé : `jerusalem-ramot` (code `JLM-01`, seed) — même magasin
 * que `admin-full-journey.spec.ts`, pour rester cohérent avec la suite
 * existante plutôt que d'introduire une nouvelle dépendance de données.
 *
 * Déterminisme des KPI : les événements analytics s'accumulent en base sans
 * jamais être réinitialisés entre deux exécutions (aucune remise à zéro n'est
 * prévue par le produit, §37 — pas de système enterprise complet). Ce test
 * ne peut donc PAS affirmer un nombre exact d'événements ; il génère des
 * événements connus immédiatement avant de vérifier le tableau de bord sur
 * la période "Aujourd'hui", puis vérifie que les compteurs concernés sont
 * au moins non nuls (jamais une égalité stricte, qui casserait au deuxième
 * lancement le même jour).
 *
 * `locator_view` (vue Store Locator) n'est JAMAIS rattaché à un magasin
 * précis (voir `lib/analytics/events.ts` — événement de la liste, pas d'une
 * fiche) : il est donc vérifié AVANT le filtre magasin, sur le tableau de
 * bord non filtré. `branch_view` (vue fiche magasin), lui, porte bien un
 * `branchId` — vérifié APRÈS le filtre, précisément parce que le filtre doit
 * le laisser passer.
 */

const BRANCH_SLUG = "jerusalem-ramot";
const BRANCH_HE_LABEL = "מעיין 2000 – רמות";
const PUBLIC_LOCALE = "fr";

test.describe.configure({ mode: "serial" });

test.describe("Parcours Analytics — événements publics → tableau de bord filtré → export (Phase 10)", () => {
  test.beforeEach(async ({ page }) => {
    // Même déterminisme que `admin-full-journey.spec.ts` : jamais un mock du
    // reste du back-office ou du Store Locator, seule la carte est bloquée.
    await page.route("https://maps.googleapis.com/**", (route) => route.abort());
  });

  test("génère des événements publics → connexion → analytics → KPI → filtre magasin → export", async ({ page }) => {
    await test.step("1. Génère des événements publics connus (vue Store Locator + vue fiche magasin)", async () => {
      // `locator_view` (§7 Phase 10, wired dans BranchLocator).
      await page.goto(`/${PUBLIC_LOCALE}/branches`);
      // `branch_view` (BranchViewTracker) — la fiche magasin elle-même.
      await page.goto(`/${PUBLIC_LOCALE}/branches/${BRANCH_SLUG}`);

      // `track()` utilise `navigator.sendBeacon`/`fetch(keepalive)` — envoi
      // asynchrone et non bloquant par conception (§7 : jamais attendu par
      // l'UI). On laisse un court délai réseau avant de lire le tableau de
      // bord, plutôt que de supposer une écriture instantanée.
      await page.waitForTimeout(500);
    });

    await test.step("2. Connexion (SUPER_ADMIN)", async () => {
      await loginAsSuperAdmin(page);
    });

    await test.step("3. Ouverture d'Analytics, période « Aujourd'hui »", async () => {
      await page.goto("/admin/analytics?period=today");
      await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
    });

    await test.step("4. Vérifie le KPI « Vues Store Locator » (non filtré — locator_view n'est jamais rattaché à un magasin)", async () => {
      // Même sélecteur `[data-slot="card"]` que `admin-full-journey.spec.ts`
      // pour `BranchCard` — ici pour isoler UNE carte KPI parmi la grille
      // (`KpiCards.tsx`, chaque carte = un `<Card>` avec sa `CardDescription`
      // comme libellé). La valeur elle-même vit dans `[data-slot="card-title"]`
      // — formatée par `Intl.NumberFormat("fr-FR")` (espace fine insécable
      // comme séparateur de milliers au-delà de 999, §16), d'où une regex qui
      // vérifie seulement "commence par un chiffre non nul" plutôt qu'une
      // égalité stricte sur un nombre exact (les événements s'accumulent sans
      // jamais être réinitialisés, voir le commentaire de tête).
      const locatorViewsCard = page.locator('[data-slot="card"]').filter({ hasText: "Vues Store Locator" }).first();
      await expect(locatorViewsCard.locator('[data-slot="card-title"]')).toHaveText(/^[1-9]/);
    });

    await test.step("5. Filtre par magasin (jerusalem-ramot) et vérifie « Vues fiches magasins »", async () => {
      await page.selectOption("#analytics-branch", { label: BRANCH_HE_LABEL });
      await page.getByRole("button", { name: "Filtrer" }).click();
      await expect(page).toHaveURL(/period=today/);
      await expect(page).toHaveURL(/branchId=/);

      // `branch_view` PORTE un `branchId` (contrairement à `locator_view`,
      // vérifié à l'étape 4 sans filtre) — doit donc rester visible après le
      // filtre, précisément sur CE magasin.
      const branchViewsCard = page.locator('[data-slot="card"]').filter({ hasText: "Vues fiches magasins" }).first();
      await expect(branchViewsCard.locator('[data-slot="card-title"]')).toHaveText(/^[1-9]/);
    });

    await test.step("6. Exporte le rapport filtré (CSV)", async () => {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Exporter CSV" }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/^analytics_.+\.csv$/);
    });
  });
});

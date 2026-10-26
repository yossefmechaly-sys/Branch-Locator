import { expect, test } from "@playwright/test";

import { prisma } from "../../lib/prisma";
import { loginAsSuperAdmin } from "./helpers/auth";

/**
 * Parcours admin complet de bout en bout (Phase 9, §28) — suite E2E
 * PERMANENTE (contrairement aux passes de vérification des phases
 * précédentes, créées puis intégralement supprimées) : ce fichier reste dans
 * le dépôt et doit continuer à passer aux phases suivantes.
 *
 * Couvre EXACTEMENT les 14 étapes demandées par le cahier des charges (§28) :
 *   1. Connexion
 *   2. Ouverture d'un magasin existant
 *   3. Modification d'une traduction
 *   4. Modification des horaires
 *   5. Enregistrement
 *   6. Vérification publique
 *   7. Création d'une promotion produit 29.90/kg
 *   8. Attribution à un magasin (portée locale)
 *   9. Mise en avant (isFeatured)
 *   10. Vérification sur `BranchCard` (Store Locator)
 *   11. Vérification sur la fiche magasin
 *   12. Modification du prix de la promotion
 *   13. Vérification de l'invalidation IMMÉDIATE du cache public
 *   14. Déconnexion
 *
 * Magasin utilisé : `jerusalem-ramot` (code `JLM-01`, préexistant dans
 * `prisma/seed-data.ts`) — jamais un magasin créé par ce test lui-même : le
 * scénario porte sur l'ÉDITION d'un magasin existant, exactement comme
 * demandé, et réutilise une donnée seed stable plutôt que d'ajouter une
 * dépendance à un test de création de magasin séparé.
 *
 * Idempotence : chaque exécution génère un identifiant unique (`runId`,
 * horodatage) injecté dans le titre HE de la promotion créée et dans le
 * "Titre SEO" FR édité — la suite peut donc être relancée plusieurs fois de
 * suite sans réinitialiser la base entre deux exécutions, chaque exécution
 * créant sa propre promotion, supprimée après chaque tentative pour éviter
 * qu'une relance ne rencontre une autre promotion de même priorité.
 *
 * Priorité 20 pour la promotion créée : le seed (Phase 9, §12) contient déjà
 * une promotion locale `fresh-chicken-ramot` sur CE magasin, `isFeatured`,
 * priorité 10 — notre promotion doit la dépasser en priorité pour devenir
 * celle réellement sélectionnée par `selectFeaturedPromotion()` (locale >
 * globale > priorité) et donc visible sur `BranchCard` à l'étape 10.
 *
 * Google Maps : non mocké par défaut — `BranchMap` gère déjà nativement
 * l'absence de script chargé via `MapErrorState` (voir
 * `lib/maps/providers/google/loader.ts`), donc le reste de la page (dont
 * `BranchCard`, hors de portée de la carte) reste fonctionnel sans clé API.
 * On intercepte uniquement `maps.googleapis.com` pour empêcher un appel
 * réseau réel si une clé était malgré tout présente dans l'environnement
 * d'exécution (déterminisme du test, jamais un mock du reste du back-office).
 */

const BRANCH_SLUG = "jerusalem-ramot";
const BRANCH_CODE = "JLM-01";
/** Nom affiché HE (Hébreu) de `jerusalem-ramot` — voir `prisma/seed-data.ts`.
 * Utilisé pour cocher ce magasin dans le sélecteur "Magasins sélectionnés"
 * du formulaire Promotions, qui affiche les options par nom HE
 * (`listBranchOptions()`, `services/admin/promotion-admin.service.ts`). */
const BRANCH_HE_LABEL = "מעיין 2000 – רמות";
const PUBLIC_LOCALE = "fr";

const runId = Date.now().toString();
const promotionSlug = `e2e-fresh-chicken-${runId}`;
const promotionTitleHe = `בדיקה E2E ${runId}`;
const promotionProductNameFr = `Poulet frais E2E ${runId}`;
const promotionTitleFr = `Promotion E2E ${runId}`;
const seoTitleMarker = `[E2E ${runId}]`;

test.describe.configure({ mode: "serial" });

test.afterEach(async () => {
  // Une tentative suivante doit pouvoir mettre sa propre promotion en avant.
  await prisma.promotion.deleteMany({ where: { slug: promotionSlug } });
});

test.afterAll(async () => { await prisma.$disconnect(); });

test.describe("Parcours admin complet — magasin + promotion structurée (Phase 9, §28)", () => {
  test.beforeEach(async ({ page }) => {
    // Voir le commentaire de tête : déterminisme, jamais un mock du reste du
    // back-office ou du Store Locator.
    await page.route("https://maps.googleapis.com/**", (route) => route.abort());
  });

  test("connexion → édition magasin → promotion structurée → vérifications publiques → déconnexion", async ({
    page,
  }) => {
    await test.step("1. Connexion (SUPER_ADMIN)", async () => {
      await loginAsSuperAdmin(page);
    });

    await test.step("2. Ouverture d'un magasin existant (jerusalem-ramot)", async () => {
      await page.goto("/admin/branches");
      const row = page.getByRole("row", { name: new RegExp(BRANCH_CODE) });
      await expect(row).toBeVisible();
      await row.getByRole("link", { name: "Modifier" }).click();
      await expect(page).toHaveURL(/\/admin\/branches\/.+\/edit$/);
    });

    await test.step("3. Modification d'une traduction (Titre SEO, FR)", async () => {
      await page.getByRole("tab", { name: "Français" }).click();
      const seoTitleInput = page.getByTestId("branch-seotitle-fr");
      // Reste sous la limite de 70 caractères, y compris après une relance.
      await seoTitleInput.fill(`Ramot ${seoTitleMarker}`);
    });

    await test.step("4. Modification des horaires (dimanche → fermeture 23:45)", async () => {
      const sundayRow = page.getByTestId("opening-hours-day-0");
      const closedCheckbox = sundayRow.getByLabel("Fermé");
      // S'assure que le dimanche est ouvert avant de modifier son horaire de
      // fermeture (le motif "standard" du seed l'est déjà — filet de sécurité
      // seulement, jamais une hypothèse silencieuse).
      if (await closedCheckbox.isChecked()) {
        await closedCheckbox.uncheck();
      }
      await page.getByTestId("opening-hours-close-0").fill("23:45");
    });

    await test.step("5. Enregistrement", async () => {
      await page.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page).toHaveURL(/\/admin\/branches$/);
      // Les annonces de navigation de Next.js sont hors du contenu principal.
      // Toute alerte du formulaire ou de la page reste un échec du test.
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    });

    await test.step("6. Vérification publique (fiche magasin FR)", async () => {
      await page.goto(`/${PUBLIC_LOCALE}/branches/${BRANCH_SLUG}`);
      await expect(page).toHaveTitle(new RegExp(seoTitleMarker.replace(/[[\]]/g, "\\$&")));
      await expect(page.getByText("23:45")).toBeVisible();
    });

    await test.step("7. Création d'une promotion produit 29.90/kg", async () => {
      await page.goto("/admin/promotions/new");

      await page.getByTestId("promotion-slug").fill(promotionSlug);
      await page.getByTestId("promotion-price").fill("29.90");

      await page.getByTestId("promotion-unit-trigger").click();
      await page.getByRole("option", { name: "Au kilogramme (kg)" }).click();

      // La promotion doit être active à la date réelle du test.
      const day = 24 * 60 * 60 * 1000;
      const now = Date.now();
      await page.getByTestId("promotion-start-date").fill(new Date(now - 7 * day).toISOString().slice(0, 10));
      await page.getByTestId("promotion-end-date").fill(new Date(now + 7 * day).toISOString().slice(0, 10));

      await page.getByTestId("promotion-status-trigger").click();
      await page.getByRole("option", { name: "Active", exact: true }).click();

      // Traduction HE obligatoire (§11 : titre requis en hébreu).
      await page.getByRole("tab", { name: "עברית" }).click();
      await page.getByTestId("promotion-title-he").fill(promotionTitleHe);
      await page.getByTestId("promotion-productname-he").fill("עוף טרי E2E");

      // Traduction FR — nécessaire pour la vérification publique (étapes 10/11).
      await page.getByRole("tab", { name: "Français" }).click();
      await page.getByTestId("promotion-title-fr").fill(promotionTitleFr);
      await page.getByTestId("promotion-productname-fr").fill(promotionProductNameFr);
    });

    await test.step("8. Attribution à un magasin (portée locale, jamais globale)", async () => {
      await page.getByLabel("Magasins sélectionnés").check();
      await page.getByLabel(BRANCH_HE_LABEL, { exact: true }).check();
    });

    await test.step("9. Mise en avant (isFeatured) + priorité au-dessus du seed", async () => {
      await page.getByLabel(/Promotion du jour/).check();
      // Dépasse la promotion seed `fresh-chicken-ramot` (priorité 10, même
      // magasin, également featured) — voir le commentaire de tête.
      await page.getByTestId("promotion-priority").fill("20");

      await page.getByRole("button", { name: "Créer la promotion" }).click();
      await expect(page).toHaveURL(/\/admin\/promotions$/);
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
      await expect(page.getByRole("row", { name: new RegExp(runId) })).toBeVisible();
    });

    await test.step("10. Vérification sur BranchCard (Store Locator, FR)", async () => {
      await page.goto(`/${PUBLIC_LOCALE}/branches`);
      const card = page
        .locator('[data-slot="card"]')
        .filter({ hasText: "Maayan 2000 – Ramot" })
        .first();
      await expect(card).toBeVisible();
      await expect(card.getByText(promotionProductNameFr)).toBeVisible();
      await expect(card.getByText(/29[.,]90/)).toBeVisible();
    });

    await test.step("11. Vérification sur la fiche magasin (section Promotions)", async () => {
      await page.goto(`/${PUBLIC_LOCALE}/branches/${BRANCH_SLUG}`);
      const promotionsSection = page.locator("section[aria-labelledby='branch-promotions-heading']");
      await expect(promotionsSection).toBeVisible();

      // La promotion peut être au-delà des 4 premières affichées — déplie la
      // section le cas échéant plutôt que de supposer un ordre précis.
      if (!(await promotionsSection.getByText(promotionProductNameFr).isVisible())) {
        const expandButton = promotionsSection.getByRole("button", { name: /Voir toutes/ });
        if (await expandButton.isVisible()) await expandButton.click();
      }

      await expect(promotionsSection.getByText(promotionProductNameFr)).toBeVisible();
      await expect(promotionsSection.getByText(/29[.,]90/)).toBeVisible();
    });

    await test.step("12. Modification du prix de la promotion", async () => {
      await page.goto("/admin/promotions");
      const row = page.getByRole("row", { name: new RegExp(runId) });
      await row.getByRole("link", { name: "Modifier" }).click();
      await expect(page).toHaveURL(/\/admin\/promotions\/.+\/edit$/);

      const priceInput = page.getByTestId("promotion-price");
      await priceInput.fill("24.90");
      await page.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page).toHaveURL(/\/admin\/promotions$/);
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    });

    await test.step("13. Invalidation IMMÉDIATE du cache public (jamais d'attente des 60s d'ISR)", async () => {
      await page.goto(`/${PUBLIC_LOCALE}/branches/${BRANCH_SLUG}`);
      const promotionsSection = page.locator("section[aria-labelledby='branch-promotions-heading']");
      if (!(await promotionsSection.getByText(promotionProductNameFr).isVisible())) {
        const expandButton = promotionsSection.getByRole("button", { name: /Voir toutes/ });
        if (await expandButton.isVisible()) await expandButton.click();
      }
      await expect(promotionsSection.getByText(/24[.,]90/)).toBeVisible();
      await expect(promotionsSection.getByText(/29[.,]90/)).toHaveCount(0);
    });

    await test.step("14. Déconnexion", async () => {
      await page.goto("/admin");
      await page.getByRole("button", { name: "Déconnexion" }).click();
      await expect(page).toHaveURL(/\/admin\/login/);

      // Confirme qu'aucune session résiduelle ne permet de revenir sur
      // `/admin` sans se reconnecter (§1/§24 : la sécurité serveur, pas
      // seulement un lien masqué côté client).
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  });
});

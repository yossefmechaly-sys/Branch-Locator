import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { loginAsSuperAdmin } from "./helpers/auth";

/**
 * Parcours Import (Phase 10, §44/priorité #8 de l'utilisateur) — suite E2E
 * PERMANENTE au même titre que `admin-full-journey.spec.ts` (Phase 9, §28) :
 * ce fichier reste dans le dépôt et continue d'être exécuté aux phases
 * suivantes, jamais supprimé après vérification.
 *
 * Couvre le parcours demandé dans l'ordre : télécharger le template →
 * upload → aperçu (dry-run) → détecter une erreur → corriger le fichier →
 * confirmer → vérifier le magasin sur le Store Locator public.
 *
 * Le fichier CSV est construit en mémoire avec les colonnes EXACTES de
 * `BRANCH_IMPORT_COLUMNS` (`lib/import/branch-import.ts`), jamais copié à la
 * main : si l'ordre des colonnes change un jour, ce test échouera de façon
 * explicite plutôt que de silencieusement importer les mauvaises valeurs
 * dans les mauvaises colonnes.
 *
 * Idempotence : `runId` (horodatage) rend `branchCode`/`slug` uniques à
 * chaque exécution — la suite peut être relancée plusieurs fois de suite
 * sans réinitialiser la base, comme `admin-full-journey.spec.ts`.
 */

const runId = Date.now().toString();
const NEW_BRANCH_CODE = `E2E-IMP-${runId}`;
const NEW_BRANCH_SLUG = `e2e-import-${runId}`;
const NEW_BRANCH_NAME_HE = `בדיקת ייבוא E2E ${runId}`;
const NEW_BRANCH_NAME_FR = `Magasin test import E2E ${runId}`;
const EXISTING_CITY_SLUG = "jerusalem"; // `prisma/seed-data.ts` — ville stable, jamais créée par ce test.
const PUBLIC_LOCALE = "fr";

test.describe.configure({ mode: "serial" });

/** Colonnes du template officiel, DANS CET ORDRE — dupliqué ici
 * volontairement (plutôt qu'un import direct depuis `lib/import/branch-import.ts`,
 * un module serveur non conçu pour tourner côté test Playwright) : voir le
 * commentaire de tête sur l'intention (détecter un changement de colonnes). */
const IMPORT_COLUMNS = [
  "branchCode",
  "slug",
  "citySlug",
  "district",
  "address",
  "postalCode",
  "latitude",
  "longitude",
  "phone",
  "email",
  "whatsappNumber",
  "whatsappGroupUrl",
  "wazeUrlOverride",
  "isActive",
  "sortOrder",
  "serviceSlugs",
  "hours_dim",
  "hours_lun",
  "hours_mar",
  "hours_mer",
  "hours_jeu",
  "hours_ven",
  "hours_sam",
  "displayName_he",
  "displayName_en",
  "displayName_ru",
  "displayName_fr",
  "displayName_es",
] as const;

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(rows: Record<(typeof IMPORT_COLUMNS)[number], string>[]): string {
  const header = IMPORT_COLUMNS.map(csvField).join(",");
  const lines = rows.map((row) => IMPORT_COLUMNS.map((col) => csvField(row[col] ?? "")).join(","));
  return [header, ...lines].join("\n");
}

/** Ligne VALIDE (nouveau magasin) — sert de base à la ligne invalide
 * ci-dessous, qui n'en modifie que `citySlug`. */
const VALID_ROW: Record<(typeof IMPORT_COLUMNS)[number], string> = {
  branchCode: NEW_BRANCH_CODE,
  slug: NEW_BRANCH_SLUG,
  citySlug: EXISTING_CITY_SLUG,
  district: "",
  address: "Rue de test E2E 1",
  postalCode: "",
  latitude: "31.78",
  longitude: "35.22",
  phone: "+972-2-9999999",
  email: "",
  whatsappNumber: "",
  whatsappGroupUrl: "",
  wazeUrlOverride: "",
  isActive: "vrai",
  sortOrder: "0",
  serviceSlugs: "",
  hours_dim: "09:00-18:00",
  hours_lun: "09:00-18:00",
  hours_mar: "09:00-18:00",
  hours_mer: "09:00-18:00",
  hours_jeu: "09:00-18:00",
  hours_ven: "09:00-14:00",
  hours_sam: "",
  displayName_he: NEW_BRANCH_NAME_HE,
  displayName_en: `E2E import test store ${runId}`,
  displayName_ru: "",
  displayName_fr: NEW_BRANCH_NAME_FR,
  displayName_es: "",
};

/** Même ligne, mais avec une ville inconnue — doit produire une erreur
 * bloquante à l'aperçu (§25/§27), sans empêcher `VALID_ROW` d'être importée
 * dans le même fichier (§28 : une ligne en erreur n'est jamais bloquante
 * pour les autres lignes valides). */
// Préfixe (jamais suffixe) délibérément DIFFÉRENT de `NEW_BRANCH_SLUG` — un
// suffixe (`${NEW_BRANCH_SLUG}-b`) rendrait les deux slugs ambigus pour les
// assertions `getByRole("row", { name: /slug/ })` ci-dessous (l'un serait un
// sous-texte de l'autre).
const BAD_BRANCH_CODE = `E2E-IMP-BAD-${runId}`;
const BAD_BRANCH_SLUG = `e2e-import-bad-${runId}`;

const INVALID_ROW: Record<(typeof IMPORT_COLUMNS)[number], string> = {
  ...VALID_ROW,
  branchCode: BAD_BRANCH_CODE,
  slug: BAD_BRANCH_SLUG,
  citySlug: "ville-inexistante-e2e",
  displayName_he: `${NEW_BRANCH_NAME_HE} B`,
};

function writeTempCsv(content: string, fileName: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "e2e-import-"));
  const filePath = path.join(dir, fileName);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

test.describe("Parcours Import — template → aperçu → erreur → correction → confirmation → vérification publique (Phase 10)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://maps.googleapis.com/**", (route) => route.abort());
  });

  test("télécharge le template → upload avec une erreur → corrige → confirme → vérifie le magasin public", async ({
    page,
  }) => {
    await test.step("1. Connexion (SUPER_ADMIN)", async () => {
      await loginAsSuperAdmin(page);
    });

    await test.step("2. Ouverture de la page Import / Export", async () => {
      await page.goto("/admin/import-export");
      await expect(page.getByRole("heading", { name: "Import / Export" })).toBeVisible();
    });

    await test.step("3. Téléchargement du template CSV officiel", async () => {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Télécharger le template CSV" }).click(),
      ]);
      expect(download.suggestedFilename()).toBe("magasins-template.csv");
    });

    await test.step("4. Upload d'un fichier contenant une ligne valide ET une ligne en erreur (ville inconnue)", async () => {
      const filePath = writeTempCsv(buildCsv([VALID_ROW, INVALID_ROW]), "import-with-error.csv");
      await page.locator('input[type="file"]').setInputFiles(filePath);
      await page.getByRole("button", { name: "Analyser (aperçu, aucune écriture)" }).click();

      // Aperçu / dry-run (§25) : aucune écriture, juste une validation.
      await expect(page.getByText('Aperçu — « import-with-error.csv »')).toBeVisible();
    });

    await test.step("5. Détecte l'erreur dans l'aperçu (ville inconnue), sans bloquer la ligne valide", async () => {
      // Ligne valide → badge "Nouveau", aucune erreur affichée dans sa cellule Détails.
      const validRow = page.getByRole("row", { name: new RegExp(NEW_BRANCH_SLUG) });
      await expect(validRow.getByText("Nouveau", { exact: true })).toBeVisible();

      // Ligne en erreur → badge "Erreur" + message explicite (ville inconnue).
      const badRow = page.getByRole("row", { name: new RegExp(BAD_BRANCH_SLUG) });
      await expect(badRow.getByText("Erreur", { exact: true })).toBeVisible();
      await expect(badRow.getByText(/Ville inconnue.*ville-inexistante-e2e/)).toBeVisible();

      // Résumé : exactement 1 ligne à créer, 1 ligne en erreur (§24 : les deux
      // sont des catégories distinctes, comptées séparément).
      await expect(page.getByRole("button", { name: /Confirmer l'import \(1 ligne/ })).toBeVisible();

      // Le bouton de confirmation reste utilisable (ligne valide présente) —
      // seule la ligne en erreur est exclue, jamais l'ensemble du fichier
      // (§28, impératif).
      await expect(page.getByRole("button", { name: /Confirmer l'import/ })).toBeEnabled();
    });

    await test.step("6. Corrige le fichier (ville valide) et relance l'aperçu", async () => {
      const correctedInvalidRow = { ...INVALID_ROW, citySlug: EXISTING_CITY_SLUG };
      const filePath = writeTempCsv(buildCsv([VALID_ROW, correctedInvalidRow]), "import-corrected.csv");
      await page.locator('input[type="file"]').setInputFiles(filePath);
      await page.getByRole("button", { name: "Analyser (aperçu, aucune écriture)" }).click();

      await expect(page.getByText('Aperçu — « import-corrected.csv »')).toBeVisible();
      await expect(page.getByText(/Ville inconnue/)).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Confirmer l'import \(2 ligne/ })).toBeVisible();
    });

    await test.step("7. Confirme l'import (transaction réelle, §28)", async () => {
      await page.getByRole("button", { name: /Confirmer l'import/ }).click();
      // `CardTitle`/`CardDescription` sont des `<div>` (voir `components/ui/card.tsx`),
      // jamais de vrais éléments de titre HTML — `getByText`, pas `getByRole("heading")`.
      await expect(page.getByText("Import terminé", { exact: true })).toBeVisible();
      await expect(page.getByText(/2 magasin\(s\) créé\(s\)/)).toBeVisible();
    });

    await test.step("8. Vérifie le nouveau magasin sur le Store Locator public (FR)", async () => {
      await page.goto(`/${PUBLIC_LOCALE}/branches/${NEW_BRANCH_SLUG}`);
      await expect(page.getByText(NEW_BRANCH_NAME_FR)).toBeVisible();
      // Horaires importés (§29) : vendredi fermeture 14:00.
      await expect(page.getByText("14:00")).toBeVisible();
    });
  });
});

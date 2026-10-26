import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Identifiants du compte SUPER_ADMIN de démonstration (Phase 9, §1,
 * `prisma/seed.ts#seedAdminUsers`) — jamais créés automatiquement en
 * production (garde explicite sur `NODE_ENV`, voir le seed), donc valides
 * uniquement contre une base de développement/CI seedée. Surchageables via
 * variables d'environnement pour un environnement CI qui utiliserait
 * d'autres identifiants de test.
 */
export const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@maayan2000-demo.local";
export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Demo1234!SuperAdmin";

/**
 * Connecte la page fournie en tant que SUPER_ADMIN via le vrai formulaire de
 * connexion (`/admin/login`) — jamais un contournement direct de session
 * (§1/§24 : la sécurité passe entièrement par ce formulaire, la suite E2E ne
 * doit donc jamais l'éviter). Attend la redirection vers `/admin`
 * (tableau de bord) qui confirme une session serveur réellement établie.
 */
export async function loginAsSuperAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN_EMAIL);
  await page.getByLabel("Mot de passe").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

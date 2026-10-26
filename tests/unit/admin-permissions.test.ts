import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";

/**
 * Matrice de permissions (Phase 9, §1/§24) — LA source de vérité testée
 * exhaustivement ici ; toute autre couche (Server Actions, pages) délègue à
 * `hasPermission()` sans jamais réimplémenter cette logique, donc un seul
 * test complet ici couvre transitivement tous les appelants.
 */
describe("hasPermission (Phase 9, §1) — matrice de rôles", () => {
  it("EDITOR peut consulter et écrire, jamais désactiver ni supprimer définitivement", () => {
    expect(hasPermission("EDITOR", "view")).toBe(true);
    expect(hasPermission("EDITOR", "write")).toBe(true);
    expect(hasPermission("EDITOR", "deactivate")).toBe(false);
    expect(hasPermission("EDITOR", "hardDelete")).toBe(false);
  });

  it("ADMIN peut consulter/écrire/désactiver, jamais supprimer définitivement", () => {
    expect(hasPermission("ADMIN", "view")).toBe(true);
    expect(hasPermission("ADMIN", "write")).toBe(true);
    expect(hasPermission("ADMIN", "deactivate")).toBe(true);
    expect(hasPermission("ADMIN", "hardDelete")).toBe(false);
  });

  it("SUPER_ADMIN peut tout faire, y compris la suppression définitive (§22)", () => {
    expect(hasPermission("SUPER_ADMIN", "view")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "write")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "deactivate")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "hardDelete")).toBe(true);
  });
});

/**
 * Actions analytics/import/export (Phase 10, §35) — EDITOR a la lecture
 * analytics mais rien de plus ; ADMIN et SUPER_ADMIN ont tout (aucune
 * décision documentée ne réserve l'import à SUPER_ADMIN seul, §35).
 */
describe("hasPermission (Phase 10, §35) — analytics/import/export", () => {
  it("EDITOR peut lire les analytics mais rien d'autre (export/import refusés)", () => {
    expect(hasPermission("EDITOR", "analytics.read")).toBe(true);
    expect(hasPermission("EDITOR", "analytics.export")).toBe(false);
    expect(hasPermission("EDITOR", "import.preview")).toBe(false);
    expect(hasPermission("EDITOR", "import.execute")).toBe(false);
    expect(hasPermission("EDITOR", "export.data")).toBe(false);
  });

  it("ADMIN a accès à toutes les actions analytics/import/export", () => {
    expect(hasPermission("ADMIN", "analytics.read")).toBe(true);
    expect(hasPermission("ADMIN", "analytics.export")).toBe(true);
    expect(hasPermission("ADMIN", "import.preview")).toBe(true);
    expect(hasPermission("ADMIN", "import.execute")).toBe(true);
    expect(hasPermission("ADMIN", "export.data")).toBe(true);
  });

  it("SUPER_ADMIN a accès à toutes les actions analytics/import/export", () => {
    expect(hasPermission("SUPER_ADMIN", "analytics.read")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "analytics.export")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "import.preview")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "import.execute")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "export.data")).toBe(true);
  });
});

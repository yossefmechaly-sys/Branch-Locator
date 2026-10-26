import { beforeEach, describe, expect, it, vi } from "vitest";

// Voir le commentaire équivalent dans admin-promotion-service.test.ts :
// `vi.mock()` est hissé au-dessus des `const` qui le précèdent, d'où
// `vi.hoisted()` pour la valeur référencée par la factory ci-dessous.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Imports APRÈS les mocks (convention vitest — `vi.mock` est hissé, mais les
// imports doivent tout de même suivre pour rester lisibles dans l'ordre).
import {
  AdminAuthorizationError,
  AdminUnauthenticatedError,
  requireAdminPermission,
  requireAdminSession,
  requireMutationPermission,
} from "@/lib/auth/require";

/**
 * Gardes serveur (Phase 9, §1/§24) — testées ICI en isolant `auth()`
 * (Auth.js) : ces tests répondent directement aux scénarios explicitement
 * demandés en §24 — utilisateur non authentifié, chaque rôle, session
 * expirée (= `auth()` retourne `null`, indistinguable côté serveur d'une
 * absence de connexion — voir le commentaire de `authorize()` dans
 * `lib/auth/config.ts`).
 */
describe("requireAdminSession (Phase 9, §1) — pages/layouts", () => {
  beforeEach(() => authMock.mockReset());

  it("redirige vers /admin/login quand aucune session n'existe (utilisateur non authentifié)", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireAdminSession()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirige aussi quand la session est expirée (auth() retourne null, § session expirée)", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireAdminSession()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("retourne l'utilisateur quand une session valide existe", async () => {
    const user = { id: "u1", email: "admin@example.com", name: "Admin", role: "ADMIN" as const };
    authMock.mockResolvedValue({ user });
    await expect(requireAdminSession()).resolves.toEqual({ user });
  });
});

describe("requireMutationPermission (Phase 9, §1/§19/§24) — Server Actions", () => {
  beforeEach(() => authMock.mockReset());

  it("lève AdminUnauthenticatedError (jamais une redirection) quand aucune session n'existe", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireMutationPermission("write")).rejects.toBeInstanceOf(AdminUnauthenticatedError);
  });

  it("lève AdminAuthorizationError pour EDITOR sur une action hardDelete (§22/§24 : « suppression refusée EDITOR »)", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", email: "e@x.com", name: "E", role: "EDITOR" } });
    await expect(requireMutationPermission("hardDelete")).rejects.toBeInstanceOf(AdminAuthorizationError);
  });

  it("lève AdminAuthorizationError pour ADMIN sur une action hardDelete (§22 : réservé SUPER_ADMIN)", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", email: "a@x.com", name: "A", role: "ADMIN" } });
    await expect(requireMutationPermission("hardDelete")).rejects.toBeInstanceOf(AdminAuthorizationError);
  });

  it("résout pour SUPER_ADMIN sur une action hardDelete", async () => {
    const user = { id: "u1", email: "s@x.com", name: "S", role: "SUPER_ADMIN" as const };
    authMock.mockResolvedValue({ user });
    await expect(requireMutationPermission("hardDelete")).resolves.toEqual(user);
  });

  it("résout pour EDITOR sur une action write (les trois rôles peuvent éditer du contenu)", async () => {
    const user = { id: "u1", email: "e@x.com", name: "E", role: "EDITOR" as const };
    authMock.mockResolvedValue({ user });
    await expect(requireMutationPermission("write")).resolves.toEqual(user);
  });
});

/**
 * Phase 10, §35/§43 — matrice analytics/import/export exercée au niveau des
 * gardes serveur elles-mêmes (pas seulement `hasPermission()` en isolation,
 * déjà testé dans `admin-permissions.test.ts`) : c'est CE chemin
 * (`requireMutationPermission`/`requireAdminPermission`) que les Server
 * Actions et pages appellent réellement.
 */
describe("requireMutationPermission (Phase 10, §35) — analytics/import/export", () => {
  beforeEach(() => authMock.mockReset());

  it("lève AdminUnauthenticatedError sans session, pour analytics.export comme pour n'importe quelle action (§43)", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireMutationPermission("analytics.export")).rejects.toBeInstanceOf(AdminUnauthenticatedError);
    await expect(requireMutationPermission("import.execute")).rejects.toBeInstanceOf(AdminUnauthenticatedError);
    await expect(requireMutationPermission("export.data")).rejects.toBeInstanceOf(AdminUnauthenticatedError);
  });

  it("EDITOR peut lire les analytics mais se voit refuser export/import (§35, §43)", async () => {
    const user = { id: "u1", email: "e@x.com", name: "E", role: "EDITOR" as const };
    authMock.mockResolvedValue({ user });
    await expect(requireMutationPermission("analytics.read")).resolves.toEqual(user);
    await expect(requireMutationPermission("analytics.export")).rejects.toBeInstanceOf(AdminAuthorizationError);
    await expect(requireMutationPermission("import.preview")).rejects.toBeInstanceOf(AdminAuthorizationError);
    await expect(requireMutationPermission("import.execute")).rejects.toBeInstanceOf(AdminAuthorizationError);
    await expect(requireMutationPermission("export.data")).rejects.toBeInstanceOf(AdminAuthorizationError);
  });

  it("ADMIN peut exécuter un import réel (§35 : pas réservé à SUPER_ADMIN)", async () => {
    const user = { id: "u1", email: "a@x.com", name: "A", role: "ADMIN" as const };
    authMock.mockResolvedValue({ user });
    await expect(requireMutationPermission("import.execute")).resolves.toEqual(user);
    await expect(requireMutationPermission("export.data")).resolves.toEqual(user);
  });
});

describe("requireAdminPermission (Phase 10, §9) — page /admin/analytics", () => {
  beforeEach(() => authMock.mockReset());

  it("redirige vers /admin?erreur=permission si le rôle n'a pas la permission (jamais une page blanche)", async () => {
    // `analytics.export` n'est qu'un exemple d'action refusée à EDITOR ici —
    // le test représentatif de la page elle-même utilise `analytics.read`,
    // accordée aux trois rôles ; on vérifie donc plutôt le cas de refus avec
    // une action EDITOR ne possède pas.
    authMock.mockResolvedValue({ user: { id: "u1", email: "e@x.com", name: "E", role: "EDITOR" } });
    await expect(requireAdminPermission("import.execute")).rejects.toThrow("REDIRECT:/admin?erreur=permission");
  });

  it("résout pour EDITOR sur analytics.read (§35 : les trois rôles)", async () => {
    const user = { id: "u1", email: "e@x.com", name: "E", role: "EDITOR" as const };
    authMock.mockResolvedValue({ user });
    await expect(requireAdminPermission("analytics.read")).resolves.toEqual({ user });
  });
});

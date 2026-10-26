import { describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";

// Ce test n'exerce que le mapping pur erreur → `AdminMutationError` : aucun
// scénario ici n'a besoin d'une vraie session ni d'une vraie requête Prisma.
// Mais `@/lib/auth/require` importe `@/lib/auth` → `lib/auth/config.ts` →
// `services/admin-user.repository.prisma.ts` → `@/lib/prisma`, qui charge le
// client `@prisma/client` généré — indisponible dans ce bac à sable
// (`prisma generate` bloqué par le réseau, voir le rapport final §26). On
// mocke donc `@/lib/prisma` ici comme dans admin-promotion-service.test.ts,
// uniquement pour couper cette chaîne d'import, jamais utilisé directement.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  AdminConflictError,
  AdminNotFoundError,
  AdminRelationInUseError,
  toMutationError,
} from "@/lib/admin/mutation-result";
import { AdminAuthorizationError, AdminUnauthenticatedError } from "@/lib/auth/require";

/**
 * `toMutationError()` (Phase 9, §19) — LA seule fonction qui traduit une
 * exception levée n'importe où dans le pipeline
 * auth → autorisation → Zod → service → repository en un résultat normalisé.
 * Chaque branche de son `if` est testée ici individuellement.
 */
describe("toMutationError (Phase 9, §19)", () => {
  it("normalise une session absente en UNAUTHENTICATED", () => {
    const result = toMutationError(new AdminUnauthenticatedError());
    expect(result).toEqual({ success: false, error: { code: "UNAUTHENTICATED", message: expect.any(String) } });
  });

  it("normalise une permission refusée en FORBIDDEN", () => {
    const result = toMutationError(new AdminAuthorizationError("hardDelete"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
  });

  it("normalise un conflit de concurrence en CONFLICT (§17)", () => {
    const result = toMutationError(new AdminConflictError());
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("CONFLICT");
  });

  it("normalise une entité introuvable en NOT_FOUND", () => {
    const result = toMutationError(new AdminNotFoundError());
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("normalise une relation encore utilisée en RELATION_IN_USE (§22)", () => {
    const result = toMutationError(new AdminRelationInUseError("3 magasins référencent encore cette ville"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("RELATION_IN_USE");
  });

  it("normalise une ZodError en VALIDATION avec des erreurs par champ", () => {
    const schema = z.object({ title: z.string().min(1) });
    const parseResult = schema.safeParse({ title: "" });
    expect(parseResult.success).toBe(false);

    const result = toMutationError(parseResult.error as ZodError);
    expect(result.success).toBe(false);
    if (!result.success && result.error.code === "VALIDATION") {
      expect(result.error.fieldErrors.title).toBeDefined();
    } else {
      throw new Error("attendu VALIDATION");
    }
  });

  it("normalise une erreur inconnue en UNKNOWN, sans jamais laisser fuiter le message technique brut", () => {
    const result = toMutationError(new Error("boom interne indésirable"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN");
      expect(result.error.message).not.toContain("boom interne indésirable");
    }
  });
});

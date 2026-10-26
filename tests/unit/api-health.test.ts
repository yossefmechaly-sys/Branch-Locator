import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Phase 11, §16bis (observabilité) — régression pour `GET /api/health`.
 * Vérifie les deux garanties explicitement requises : (1) un statut `ok`/
 * `degraded` selon que la base répond réellement (pas seulement que le
 * process Node tourne), (2) qu'AUCUN détail sensible (message d'erreur brut,
 * chaîne de connexion, trace de pile) ne fuite jamais dans la réponse JSON —
 * seul `console.error` (jamais renvoyé au client) reçoit l'erreur complète.
 */
const { queryRawMock } = vi.hoisted(() => ({ queryRawMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: queryRawMock },
}));

describe("GET /api/health (Phase 11, §16bis)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("retourne { status: 'ok' } avec 200 quand la base répond", async () => {
    queryRawMock.mockResolvedValue([{ "?column?": 1 }]);
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
  });

  it("retourne { status: 'degraded' } avec 503 si la base échoue, sans jamais exposer l'erreur brute", async () => {
    queryRawMock.mockRejectedValue(new Error("password authentication failed for user \"admin\" on host db.internal:5432"));
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    // Aucune clé additionnelle (message, stack, code) — uniquement status/timestamp.
    expect(Object.keys(body).sort()).toEqual(["status", "timestamp"]);
    expect(JSON.stringify(body)).not.toContain("password");
    expect(JSON.stringify(body)).not.toContain("db.internal");
  });
});

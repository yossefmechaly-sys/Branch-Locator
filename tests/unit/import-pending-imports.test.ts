import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetPendingImportsForTests,
  createPendingImport,
  peekPendingImport,
  takePendingImport,
} from "@/lib/import/pending-imports";

/**
 * Store en mémoire des imports en attente (Phase 10, §19/§24/§25) — un
 * `importId` doit être à USAGE UNIQUE (§19 : éviter les doubles
 * soumissions) et expirer après un délai raisonnable (limitation documentée,
 * même principe que `lib/analytics/rate-limit.ts`).
 */
function pendingData(overrides: Partial<Parameters<typeof createPendingImport>[0]> = {}) {
  return {
    rawRows: [{ branchCode: "A" }],
    headerKeys: ["branchCode"],
    fileName: "test.csv",
    entityType: "branch" as const,
    createdBy: "user-1",
    ...overrides,
  };
}

describe("pending-imports (Phase 10, §19/§24/§25)", () => {
  beforeEach(() => {
    __resetPendingImportsForTests();
  });

  it("crée un import en attente consultable par peekPendingImport", () => {
    const importId = createPendingImport(pendingData());
    const entry = peekPendingImport(importId);
    expect(entry?.fileName).toBe("test.csv");
    expect(entry?.rawRows).toEqual([{ branchCode: "A" }]);
  });

  it("takePendingImport consomme l'entrée — un second appel renvoie null (usage unique)", () => {
    const importId = createPendingImport(pendingData());
    const first = takePendingImport(importId);
    const second = takePendingImport(importId);
    expect(first?.fileName).toBe("test.csv");
    expect(second).toBeNull();
  });

  it("un importId inconnu renvoie null", () => {
    expect(takePendingImport("id-inexistant")).toBeNull();
    expect(peekPendingImport("id-inexistant")).toBeNull();
  });

  it("deux imports créés successivement ont des importId distincts", () => {
    const a = createPendingImport(pendingData());
    const b = createPendingImport(pendingData());
    expect(a).not.toBe(b);
  });
});

describe("pending-imports — expiration (TTL)", () => {
  beforeEach(() => {
    __resetPendingImportsForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("une entrée expirée n'est plus accessible", () => {
    const importId = createPendingImport(pendingData());
    vi.advanceTimersByTime(21 * 60 * 1000); // > 20 minutes de TTL documenté
    expect(peekPendingImport(importId)).toBeNull();
    expect(takePendingImport(importId)).toBeNull();
  });

  it("une entrée non expirée reste accessible", () => {
    const importId = createPendingImport(pendingData());
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(peekPendingImport(importId)).not.toBeNull();
  });
});

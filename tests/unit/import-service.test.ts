import { beforeEach, describe, expect, it, vi } from "vitest";

// Même pattern que `admin-promotion-service.test.ts` (voir son commentaire de
// tête) : `vi.mock()` est hissé au-dessus des `const`, d'où `vi.hoisted()`
// pour les valeurs référencées par les factories ci-dessous.
const { prismaMock, invalidateCacheMock } = vi.hoisted(() => {
  const txMock = {
    branch: { create: vi.fn(), update: vi.fn() },
    branchOpeningHours: { deleteMany: vi.fn() },
    branchService: { deleteMany: vi.fn() },
    branchTranslation: { deleteMany: vi.fn() },
  };
  return {
    prismaMock: {
      city: { findMany: vi.fn() },
      service: { findMany: vi.fn() },
      branch: { findMany: vi.fn() },
      auditLog: { create: vi.fn() },
      // Invoque réellement le callback avec le même mock `tx` — permet
      // d'observer les appels `tx.branch.create`/`update` faits À L'INTÉRIEUR
      // de la transaction (§28 : une seule transaction pour toutes les lignes
      // valides), sans jamais toucher une vraie base Postgres (indisponible
      // en sandbox — voir la limitation documentée dans le rapport final).
      $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<void>) => {
        await callback(txMock);
      }),
      // Exposé pour que les tests puissent inspecter/réinitialiser `tx.*`.
      __tx: txMock,
    },
    invalidateCacheMock: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/admin/cache", () => ({ invalidatePublicBranchCaches: invalidateCacheMock }));

import { executeBranchImport, loadBranchImportLookups } from "@/services/admin/import.service";
import { BRANCH_IMPORT_COLUMNS } from "@/lib/import/branch-import";

const tx = prismaMock.__tx;

/** Construit une ligne brute VALIDE minimale (toutes les colonnes du
 * template, §23) — surchargeable colonne par colonne pour chaque scénario. */
function buildRow(overrides: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = {};
  for (const key of BRANCH_IMPORT_COLUMNS) base[key] = "";
  return {
    ...base,
    branchCode: "B-100",
    slug: "ramot",
    citySlug: "jerusalem",
    district: "",
    address: "Rue Ramot 12",
    postalCode: "",
    latitude: "31.8",
    longitude: "35.2",
    phone: "+972-2-1111111",
    email: "",
    whatsappNumber: "",
    whatsappGroupUrl: "",
    wazeUrlOverride: "",
    isActive: "vrai",
    sortOrder: "0",
    serviceSlugs: "",
    displayName_he: "מעיין 2000 - רמות",
    displayName_en: "Maayan 2000 - Ramot",
    ...overrides,
  };
}

const HEADER_WITHOUT_HOURS = BRANCH_IMPORT_COLUMNS.filter((k) => !k.startsWith("hours_"));
const HEADER_WITH_HOURS = [...BRANCH_IMPORT_COLUMNS];

function resetLookups() {
  prismaMock.city.findMany.mockReset().mockResolvedValue([{ id: "city-1", slug: "jerusalem" }]);
  prismaMock.service.findMany.mockReset().mockResolvedValue([]);
  prismaMock.branch.findMany.mockReset().mockResolvedValue([]);
  prismaMock.auditLog.create.mockReset().mockResolvedValue({});
  prismaMock.$transaction.mockClear();
  invalidateCacheMock.mockReset();
  tx.branch.create.mockReset().mockResolvedValue({ id: "new-branch-id" });
  tx.branch.update.mockReset().mockResolvedValue({ id: "existing-branch-id" });
  tx.branchOpeningHours.deleteMany.mockReset().mockResolvedValue({ count: 0 });
  tx.branchService.deleteMany.mockReset().mockResolvedValue({ count: 0 });
  tx.branchTranslation.deleteMany.mockReset().mockResolvedValue({ count: 0 });
}

/**
 * `services/admin/import.service.ts` (Phase 10, §24-§29, §41) — ces tests
 * couvrent ce que les tests purs de `validateImportRow`/`analyzeBranchImportRows`
 * ne peuvent PAS vérifier (aucune écriture Prisma là-bas) : la transaction
 * réelle, le choix create/update, la préservation des horaires quand le
 * fichier n'a aucune colonne `hours_*`, et l'audit/l'invalidation de cache
 * après commit.
 */
describe("loadBranchImportLookups (Phase 10, §25)", () => {
  beforeEach(resetLookups);

  it("construit les 4 lookups à partir de requêtes Prisma fraîches (jamais réutilisées d'un appel à l'autre)", async () => {
    prismaMock.branch.findMany.mockResolvedValue([{ id: "b1", branchCode: "B-1", slug: "haifa" }]);
    const lookups = await loadBranchImportLookups();
    expect(lookups.cityIdBySlug.get("jerusalem")).toBe("city-1");
    expect(lookups.existingByBranchCode.get("B-1")).toEqual({ id: "b1", slug: "haifa" });
    expect(lookups.existingBySlug.get("haifa")).toEqual({ id: "b1", branchCode: "B-1" });
  });
});

describe("executeBranchImport — création (§24)", () => {
  beforeEach(resetLookups);

  it("crée un nouveau magasin via tx.branch.create quand aucun magasin existant ne correspond", async () => {
    const result = await executeBranchImport([buildRow()], HEADER_WITH_HOURS, "actor-1", "admin@example.com");

    expect(result.wrote).toBe(true);
    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.branch.create).toHaveBeenCalledTimes(1);
    expect(tx.branch.update).not.toHaveBeenCalled();

    const createArgs = tx.branch.create.mock.calls[0][0];
    expect(createArgs.data.slug).toBe("ramot");
    expect(createArgs.data.branchCode).toBe("B-100");
    expect(createArgs.data.isDemo).toBe(false);
  });

  it("consigne une entrée AuditLog 'branch.import.create' après le commit, et invalide le cache public une seule fois", async () => {
    await executeBranchImport([buildRow()], HEADER_WITH_HOURS, "actor-1", "admin@example.com");

    expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.auditLog.create.mock.calls[0][0].data).toMatchObject({
      actorId: "actor-1",
      actorEmail: "admin@example.com",
      action: "branch.import.create",
      entityType: "Branch",
      entityId: "new-branch-id",
    });
    expect(invalidateCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidateCacheMock).toHaveBeenCalledWith(["ramot"]);
  });

  it("ne déclenche aucune transaction quand toutes les lignes sont en erreur (§28 : jamais de transaction vide)", async () => {
    // `citySlug` inconnu → erreur de validation, aucune ligne valide.
    const result = await executeBranchImport(
      [buildRow({ citySlug: "ville-inconnue" })],
      HEADER_WITH_HOURS,
      "actor-1",
      "admin@example.com"
    );

    expect(result.wrote).toBe(false);
    expect(result.created).toBe(0);
    expect(result.updated).toBe(0);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });
});

describe("executeBranchImport — mise à jour et correspondance branchCode/slug (§26)", () => {
  beforeEach(() => {
    resetLookups();
    prismaMock.branch.findMany.mockResolvedValue([{ id: "existing-branch-id", branchCode: "B-100", slug: "ramot" }]);
  });

  it("met à jour un magasin existant via tx.branch.update quand branchCode correspond, jamais tx.branch.create", async () => {
    const result = await executeBranchImport([buildRow()], HEADER_WITH_HOURS, "actor-1", "admin@example.com");

    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);
    expect(tx.branch.update).toHaveBeenCalledTimes(1);
    expect(tx.branch.create).not.toHaveBeenCalled();
    expect(tx.branch.update.mock.calls[0][0].where).toEqual({ id: "existing-branch-id" });

    expect(prismaMock.auditLog.create.mock.calls[0][0].data).toMatchObject({
      action: "branch.import.update",
      entityId: "existing-branch-id",
    });
  });

  it("purge toujours branchService et branchTranslation avant une mise à jour", async () => {
    await executeBranchImport([buildRow()], HEADER_WITH_HOURS, "actor-1", "admin@example.com");
    expect(tx.branchService.deleteMany).toHaveBeenCalledWith({ where: { branchId: "existing-branch-id" } });
    expect(tx.branchTranslation.deleteMany).toHaveBeenCalledWith({ where: { branchId: "existing-branch-id" } });
  });
});

/**
 * Correction de bug documentée (voir résumé de session) : les horaires
 * existants d'un magasin mis à jour ne doivent JAMAIS être vidés quand le
 * fichier d'import ne fournit AUCUNE colonne `hours_*` — cohérent avec
 * l'avertissement affiché à l'aperçu ("les horaires existants ne seront pas
 * modifiés", §29).
 */
describe("executeBranchImport — préservation des horaires (§29, correction de bug)", () => {
  beforeEach(() => {
    resetLookups();
    prismaMock.branch.findMany.mockResolvedValue([{ id: "existing-branch-id", branchCode: "B-100", slug: "ramot" }]);
  });

  it("NE vide PAS les horaires existants (deleteMany non appelé, champ openingHours absent de l'update) quand le fichier n'a aucune colonne hours_*", async () => {
    await executeBranchImport([buildRow()], HEADER_WITHOUT_HOURS, "actor-1", "admin@example.com");

    expect(tx.branchOpeningHours.deleteMany).not.toHaveBeenCalled();
    const updateData = tx.branch.update.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty("openingHours");
  });

  it("vide ET recrée les horaires (deleteMany appelé, champ openingHours présent) quand le fichier fournit des colonnes hours_*", async () => {
    await executeBranchImport(
      [buildRow({ hours_dim: "09:00-18:00" })],
      HEADER_WITH_HOURS,
      "actor-1",
      "admin@example.com"
    );

    expect(tx.branchOpeningHours.deleteMany).toHaveBeenCalledWith({ where: { branchId: "existing-branch-id" } });
    const updateData = tx.branch.update.mock.calls[0][0].data;
    expect(updateData).toHaveProperty("openingHours");
  });
});

describe("executeBranchImport — création sans colonnes hours_* (§29)", () => {
  beforeEach(resetLookups);

  it("crée le magasin normalement (openingHours: [] par construction) quand le fichier n'a aucune colonne hours_* — aucun deleteMany, rien à purger sur une création", async () => {
    const result = await executeBranchImport([buildRow()], HEADER_WITHOUT_HOURS, "actor-1", "admin@example.com");

    expect(result.wrote).toBe(true);
    expect(result.created).toBe(1);
    expect(tx.branchOpeningHours.deleteMany).not.toHaveBeenCalled();
    const createArgs = tx.branch.create.mock.calls[0][0];
    expect(createArgs.data.openingHours).toEqual({ create: [] });
  });
});

describe("executeBranchImport — plusieurs lignes dans une seule transaction (§28)", () => {
  beforeEach(resetLookups);

  it("écrit une ligne de création et une ligne d'erreur dans le même fichier : la ligne valide est écrite, la ligne en erreur est exclue individuellement (jamais bloquante)", async () => {
    const validRow = buildRow({ branchCode: "B-100", slug: "ramot" });
    const invalidRow = buildRow({ branchCode: "B-200", slug: "invalid slug avec espaces" });

    const result = await executeBranchImport([validRow, invalidRow], HEADER_WITH_HOURS, "actor-1", "admin@example.com");

    expect(result.created).toBe(1);
    expect(result.analysis.summary.errors).toBe(1);
    expect(tx.branch.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});

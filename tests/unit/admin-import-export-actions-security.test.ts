import { beforeEach, describe, expect, it, vi } from "vitest";

// Même convention que `admin-branch-actions-security.test.ts` /
// `admin-promotion-service.test.ts` : `vi.mock()` est hissé au-dessus des
// `const` qui le précèdent, d'où `vi.hoisted()`.
const {
  authMock,
  previewBranchImportMock,
  executeBranchImportMock,
  createPendingImportMock,
  takePendingImportMock,
  exportBranchesCsvMock,
  exportBranchesXlsxMock,
  exportPromotionsCsvMock,
  exportPromotionsXlsxMock,
  exportAnalyticsCsvMock,
  exportAnalyticsXlsxMock,
  getAnalyticsDashboardMock,
  parseImportFileMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  previewBranchImportMock: vi.fn(),
  executeBranchImportMock: vi.fn(),
  createPendingImportMock: vi.fn(),
  takePendingImportMock: vi.fn(),
  exportBranchesCsvMock: vi.fn(),
  exportBranchesXlsxMock: vi.fn(),
  exportPromotionsCsvMock: vi.fn(),
  exportPromotionsXlsxMock: vi.fn(),
  exportAnalyticsCsvMock: vi.fn(),
  exportAnalyticsXlsxMock: vi.fn(),
  getAnalyticsDashboardMock: vi.fn(),
  parseImportFileMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));

// Partiel : garde les constantes réelles (`IMPORT_ALLOWED_EXTENSIONS`, etc. —
// utilisées par `assertUploadIsSafe` dans `actions.ts`), remplace seulement
// `parseImportFile` (qui ferait un vrai parsing CSV/XLSX, hors périmètre
// d'un test de SÉCURITÉ des gardes serveur).
vi.mock("@/lib/import/branch-import", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/import/branch-import")>();
  return { ...actual, parseImportFile: parseImportFileMock };
});

vi.mock("@/lib/import/pending-imports", () => ({
  createPendingImport: createPendingImportMock,
  takePendingImport: takePendingImportMock,
}));

vi.mock("@/services/admin/import.service", () => ({
  previewBranchImport: previewBranchImportMock,
  executeBranchImport: executeBranchImportMock,
}));

vi.mock("@/services/admin/export.service", () => ({
  exportBranchesCsv: exportBranchesCsvMock,
  exportBranchesXlsx: exportBranchesXlsxMock,
  exportPromotionsCsv: exportPromotionsCsvMock,
  exportPromotionsXlsx: exportPromotionsXlsxMock,
  exportAnalyticsCsv: exportAnalyticsCsvMock,
  exportAnalyticsXlsx: exportAnalyticsXlsxMock,
}));

vi.mock("@/services/admin/analytics.service", () => ({ getAnalyticsDashboard: getAnalyticsDashboardMock }));

import {
  downloadBranchImportTemplateAction,
  executeBranchImportAction,
  exportBranchesAction,
  exportPromotionsAction,
  previewBranchImportAction,
} from "@/app/admin/(dashboard)/import-export/actions";
import { exportAnalyticsAction } from "@/app/admin/(dashboard)/analytics/actions";

function sessionFor(role: "SUPER_ADMIN" | "ADMIN" | "EDITOR") {
  return { user: { id: "u1", email: `${role}@x.com`, name: role, role } };
}

function fakeCsvFile(): File {
  return new File(["branchCode,slug\n"], "import.csv", { type: "text/csv" });
}

/**
 * Server Actions Import/Export/Analytics-export (Phase 10, §35/§43) — même
 * pipeline sécurité que les magasins/promotions (Phase 9, §24) : authentifié
 * → autorisé selon `AdminAction` → seulement alors la couche service est
 * appelée. Ces tests confirment qu'aucun des services mockés n'est JAMAIS
 * appelé quand la garde rejette (`requireMutationPermission` lève AVANT
 * toute lecture de fichier/écriture/export).
 */
describe("Server Actions Import — sécurité serveur (§35, import.preview/import.execute)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("previewBranchImportAction refuse un utilisateur non authentifié, sans jamais parser le fichier", async () => {
    authMock.mockResolvedValue(null);
    const formData = new FormData();
    formData.set("file", fakeCsvFile());

    const result = await previewBranchImportAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("UNAUTHENTICATED");
    expect(parseImportFileMock).not.toHaveBeenCalled();
    expect(previewBranchImportMock).not.toHaveBeenCalled();
    expect(createPendingImportMock).not.toHaveBeenCalled();
  });

  it("previewBranchImportAction refuse EDITOR (import.preview réservé ADMIN/SUPER_ADMIN — EDITOR n'a que analytics.read, §35)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const formData = new FormData();
    formData.set("file", fakeCsvFile());
    const result = await previewBranchImportAction(formData);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
    expect(parseImportFileMock).not.toHaveBeenCalled();
    expect(previewBranchImportMock).not.toHaveBeenCalled();
  });

  it("previewBranchImportAction autorise ADMIN et SUPER_ADMIN", async () => {
    parseImportFileMock.mockResolvedValue({ ok: true, file: { rawRows: [], headerKeys: [] } });
    previewBranchImportMock.mockResolvedValue({ rows: [], summary: { total: 0, toCreate: 0, toUpdate: 0, errors: 0, ignored: 0, withWarnings: 0 } });
    createPendingImportMock.mockReturnValue("import-id-1");

    for (const role of ["ADMIN", "SUPER_ADMIN"] as const) {
      authMock.mockResolvedValue(sessionFor(role));
      const formData = new FormData();
      formData.set("file", fakeCsvFile());
      const result = await previewBranchImportAction(formData);
      expect(result.success).toBe(true);
    }
    expect(previewBranchImportMock).toHaveBeenCalledTimes(2);
  });

  it("executeBranchImportAction refuse un utilisateur non authentifié, sans jamais consommer l'importId ni écrire", async () => {
    authMock.mockResolvedValue(null);
    const result = await executeBranchImportAction("import-id-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("UNAUTHENTICATED");
    expect(takePendingImportMock).not.toHaveBeenCalled();
    expect(executeBranchImportMock).not.toHaveBeenCalled();
  });

  it("executeBranchImportAction refuse EDITOR (import.execute réservé ADMIN/SUPER_ADMIN, §35)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const result = await executeBranchImportAction("import-id-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
    expect(takePendingImportMock).not.toHaveBeenCalled();
    expect(executeBranchImportMock).not.toHaveBeenCalled();
  });

  it("executeBranchImportAction autorise ADMIN et exécute réellement l'import (§35 : pas réservé à SUPER_ADMIN)", async () => {
    authMock.mockResolvedValue(sessionFor("ADMIN"));
    takePendingImportMock.mockReturnValue({ rawRows: [], headerKeys: [], fileName: "x.csv", entityType: "branch", createdBy: "u1" });
    executeBranchImportMock.mockResolvedValue({
      analysis: { rows: [], summary: { total: 0, toCreate: 0, toUpdate: 0, errors: 0, ignored: 0, withWarnings: 0 } },
      created: 0,
      updated: 0,
      wrote: false,
    });

    const result = await executeBranchImportAction("import-id-1");

    expect(result.success).toBe(true);
    expect(executeBranchImportMock).toHaveBeenCalledTimes(1);
  });

  it("downloadBranchImportTemplateAction refuse un utilisateur non authentifié", async () => {
    authMock.mockResolvedValue(null);
    const result = await downloadBranchImportTemplateAction();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("Server Actions Export — sécurité serveur (§35, export.data)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportBranchesCsvMock.mockResolvedValue("csv-content");
    exportBranchesXlsxMock.mockResolvedValue(Buffer.from("xlsx"));
    exportPromotionsCsvMock.mockResolvedValue("csv-content");
    exportPromotionsXlsxMock.mockResolvedValue(Buffer.from("xlsx"));
  });

  it("exportBranchesAction refuse un utilisateur non authentifié, sans jamais interroger la base", async () => {
    authMock.mockResolvedValue(null);
    const result = await exportBranchesAction("csv");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("UNAUTHENTICATED");
    expect(exportBranchesCsvMock).not.toHaveBeenCalled();
  });

  it("exportBranchesAction refuse EDITOR (export.data réservé ADMIN/SUPER_ADMIN, §35)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const result = await exportBranchesAction("xlsx");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
    expect(exportBranchesXlsxMock).not.toHaveBeenCalled();
  });

  it("exportBranchesAction autorise ADMIN pour csv ET xlsx", async () => {
    authMock.mockResolvedValue(sessionFor("ADMIN"));
    const csvResult = await exportBranchesAction("csv");
    const xlsxResult = await exportBranchesAction("xlsx");
    expect(csvResult.success).toBe(true);
    expect(xlsxResult.success).toBe(true);
    expect(exportBranchesCsvMock).toHaveBeenCalledTimes(1);
    expect(exportBranchesXlsxMock).toHaveBeenCalledTimes(1);
  });

  it("exportPromotionsAction refuse EDITOR et autorise SUPER_ADMIN", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const denied = await exportPromotionsAction("csv");
    expect(denied.success).toBe(false);
    if (!denied.success) expect(denied.error.code).toBe("FORBIDDEN");
    expect(exportPromotionsCsvMock).not.toHaveBeenCalled();

    authMock.mockResolvedValue(sessionFor("SUPER_ADMIN"));
    const allowed = await exportPromotionsAction("csv");
    expect(allowed.success).toBe(true);
    expect(exportPromotionsCsvMock).toHaveBeenCalledTimes(1);
  });
});

describe("Server Action exportAnalyticsAction — sécurité serveur (§35, analytics.export)", () => {
  const filters = { startDate: "2026-01-01", endDate: "2026-01-31" } as Parameters<typeof exportAnalyticsAction>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    getAnalyticsDashboardMock.mockResolvedValue({});
    exportAnalyticsCsvMock.mockReturnValue("csv-content");
    exportAnalyticsXlsxMock.mockResolvedValue(Buffer.from("xlsx"));
  });

  it("refuse un utilisateur non authentifié, sans jamais recalculer le tableau de bord", async () => {
    authMock.mockResolvedValue(null);
    const result = await exportAnalyticsAction(filters, "csv");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("UNAUTHENTICATED");
    expect(getAnalyticsDashboardMock).not.toHaveBeenCalled();
  });

  it("refuse EDITOR (analytics.export réservé ADMIN/SUPER_ADMIN — EDITOR n'a que analytics.read, §35)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const result = await exportAnalyticsAction(filters, "xlsx");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
    expect(getAnalyticsDashboardMock).not.toHaveBeenCalled();
  });

  it("autorise ADMIN et recalcule le tableau de bord avec les MÊMES filtres reçus (§32 : pas un second moteur d'agrégation)", async () => {
    authMock.mockResolvedValue(sessionFor("ADMIN"));
    const result = await exportAnalyticsAction(filters, "csv");
    expect(result.success).toBe(true);
    expect(getAnalyticsDashboardMock).toHaveBeenCalledWith(filters);
    expect(exportAnalyticsCsvMock).toHaveBeenCalledTimes(1);
  });
});

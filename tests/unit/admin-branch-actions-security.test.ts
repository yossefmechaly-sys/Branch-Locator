import { beforeEach, describe, expect, it, vi } from "vitest";

// Voir le commentaire équivalent dans admin-promotion-service.test.ts :
// `vi.mock()` est hissé au-dessus des `const` qui le précèdent, d'où
// `vi.hoisted()` pour les valeurs référencées par les factories ci-dessous.
const { authMock, createBranchMock, hardDeleteBranchMock, recordAuditMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  createBranchMock: vi.fn(),
  hardDeleteBranchMock: vi.fn(),
  recordAuditMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/admin/branch-admin.service", () => ({
  createBranch: createBranchMock,
  updateBranch: vi.fn(),
  setBranchActive: vi.fn(),
  hardDeleteBranch: hardDeleteBranchMock,
  listAdminBranches: vi.fn(),
  getAdminBranchById: vi.fn(),
}));
vi.mock("@/services/admin/geocoding.service", () => ({ geocodeAddress: vi.fn(), GeocodingError: class extends Error {} }));
vi.mock("@/services/admin/storage/local-storage.provider", () => ({ localStorageProvider: { save: vi.fn(), delete: vi.fn() } }));
vi.mock("@/services/admin/audit.service", () => ({ recordAudit: recordAuditMock }));

import { createBranchAction, hardDeleteBranchAction } from "@/app/admin/(dashboard)/branches/actions";

const VALID_BRANCH_PAYLOAD = {
  slug: "jerusalem-ramot",
  branchCode: "RAM-01",
  cityId: "city-1",
  district: null,
  address: "Rehov Ramot 1",
  postalCode: null,
  latitude: 31.8,
  longitude: 35.2,
  phone: null,
  email: null,
  whatsappNumber: null,
  whatsappGroupUrl: null,
  wazeUrlOverride: null,
  mainImage: null,
  isActive: true,
  sortOrder: 0,
  serviceIds: [],
  openingHours: [],
  specialHours: [],
  images: [],
  translations: [{ locale: "he", displayName: "מעיין 2000 – רמות", description: null, seoTitle: null, seoDescription: null }],
};

function sessionFor(role: "SUPER_ADMIN" | "ADMIN" | "EDITOR") {
  return { user: { id: "u1", email: `${role}@x.com`, name: role, role } };
}

/** Même pipeline de sécurité que les promotions (Phase 9, §19/§24), appliqué
 * ici aux magasins — confirme que la garde n'est pas une particularité de
 * `promotions/actions.ts` mais bien la couche partagée `lib/auth/require.ts`. */
describe("Server Actions Magasins — sécurité serveur (Phase 9, §24)", () => {
  beforeEach(() => {
    authMock.mockReset();
    createBranchMock.mockReset();
    hardDeleteBranchMock.mockReset();
    recordAuditMock.mockReset();
  });

  it("createBranchAction refuse un utilisateur non authentifié", async () => {
    authMock.mockResolvedValue(null);
    const result = await createBranchAction(VALID_BRANCH_PAYLOAD);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("UNAUTHENTICATED");
    expect(createBranchMock).not.toHaveBeenCalled();
  });

  it("createBranchAction autorise EDITOR", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    createBranchMock.mockResolvedValue({ id: "branch-1" });
    const result = await createBranchAction(VALID_BRANCH_PAYLOAD);
    expect(result.success).toBe(true);
    expect(createBranchMock).toHaveBeenCalledTimes(1);
  });

  it("hardDeleteBranchAction refuse EDITOR ET ADMIN — réservé SUPER_ADMIN (§22)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    let result = await hardDeleteBranchAction("branch-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");

    authMock.mockResolvedValue(sessionFor("ADMIN"));
    result = await hardDeleteBranchAction("branch-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");

    expect(hardDeleteBranchMock).not.toHaveBeenCalled();
  });

  it("hardDeleteBranchAction autorise SUPER_ADMIN et journalise (§18)", async () => {
    authMock.mockResolvedValue(sessionFor("SUPER_ADMIN"));
    hardDeleteBranchMock.mockResolvedValue(undefined);
    const result = await hardDeleteBranchAction("branch-1");
    expect(result.success).toBe(true);
    expect(hardDeleteBranchMock).toHaveBeenCalledWith("branch-1");
    expect(recordAuditMock).toHaveBeenCalledWith(expect.objectContaining({ role: "SUPER_ADMIN" }), "branch.hardDelete", "Branch", "branch-1");
  });

  it("rejette une charge invalide (latitude hors plage) sans jamais appeler le service", async () => {
    authMock.mockResolvedValue(sessionFor("SUPER_ADMIN"));
    const result = await createBranchAction({ ...VALID_BRANCH_PAYLOAD, latitude: 999 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("VALIDATION");
    expect(createBranchMock).not.toHaveBeenCalled();
  });
});

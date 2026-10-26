import { beforeEach, describe, expect, it, vi } from "vitest";

// Voir le commentaire équivalent dans admin-promotion-service.test.ts :
// `vi.mock()` est hissé au-dessus des `const` qui le précèdent, d'où
// `vi.hoisted()` pour les valeurs référencées par les factories ci-dessous.
const {
  authMock,
  createPromotionMock,
  updatePromotionMock,
  archivePromotionMock,
  hardDeletePromotionMock,
  recordAuditMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  createPromotionMock: vi.fn(),
  updatePromotionMock: vi.fn(),
  archivePromotionMock: vi.fn(),
  hardDeletePromotionMock: vi.fn(),
  recordAuditMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/admin/promotion-admin.service", () => ({
  createPromotion: createPromotionMock,
  updatePromotion: updatePromotionMock,
  archivePromotion: archivePromotionMock,
  hardDeletePromotion: hardDeletePromotionMock,
  listAdminPromotions: vi.fn(),
  getAdminPromotionById: vi.fn(),
  listBranchOptions: vi.fn(),
}));
vi.mock("@/services/admin/audit.service", () => ({ recordAudit: recordAuditMock }));

import {
  archivePromotionAction,
  createPromotionAction,
  hardDeletePromotionAction,
  updatePromotionAction,
} from "@/app/admin/(dashboard)/promotions/actions";

/**
 * Sécurité serveur des Server Actions Promotions (Phase 9, §19/§24/§25) —
 * chaque test ICI appelle directement la Server Action exportée, exactement
 * comme le ferait un « appel direct d'une mutation non autorisée » qui
 * contournerait complètement l'UI (§24) : la sécurité ne dépend donc jamais
 * d'un bouton visible/invisible, seulement de ce pipeline serveur.
 */
const VALID_PROMOTION_PAYLOAD = {
  slug: "fresh-chicken-ramot",
  image: null,
  price: "29.90",
  originalPrice: "39.90",
  currency: "ILS",
  unit: "KG",
  startDate: "2026-08-25",
  endDate: "2026-09-03",
  url: null,
  status: "ACTIVE",
  appliesToAll: false,
  branchIds: ["branch-1"],
  isFeatured: true,
  priority: 10,
  translations: [{ locale: "he", productName: "עוף טרי", title: "מבצע היום", description: null, ctaLabel: null }],
};

function sessionFor(role: "SUPER_ADMIN" | "ADMIN" | "EDITOR") {
  return { user: { id: "u1", email: `${role}@x.com`, name: role, role } };
}

describe("createPromotionAction (Phase 9, §11/§19/§24)", () => {
  beforeEach(() => {
    authMock.mockReset();
    createPromotionMock.mockReset();
    recordAuditMock.mockReset();
    createPromotionMock.mockResolvedValue({ id: "promo-1" });
  });

  it("refuse un utilisateur non authentifié (auth() → null) — jamais d'écriture", async () => {
    authMock.mockResolvedValue(null);
    const result = await createPromotionAction(VALID_PROMOTION_PAYLOAD);
    expect(result).toEqual({ success: false, error: { code: "UNAUTHENTICATED", message: expect.any(String) } });
    expect(createPromotionMock).not.toHaveBeenCalled();
  });

  it("accepte EDITOR (write est autorisé aux trois rôles)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const result = await createPromotionAction(VALID_PROMOTION_PAYLOAD);
    expect(result.success).toBe(true);
    expect(createPromotionMock).toHaveBeenCalledTimes(1);
    expect(recordAuditMock).toHaveBeenCalledWith(expect.objectContaining({ role: "EDITOR" }), "promotion.create", "Promotion", "promo-1");
  });

  it("rejette une charge invalide (VALIDATION) SANS jamais appeler le service — traduction hébreu absente", async () => {
    authMock.mockResolvedValue(sessionFor("SUPER_ADMIN"));
    const invalid = { ...VALID_PROMOTION_PAYLOAD, translations: [{ locale: "en", title: "x", productName: null, description: null, ctaLabel: null }] };
    const result = await createPromotionAction(invalid);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("VALIDATION");
    expect(createPromotionMock).not.toHaveBeenCalled();
  });
});

describe("hardDeletePromotionAction (Phase 9, §22/§24) — suppression réservée SUPER_ADMIN", () => {
  beforeEach(() => {
    authMock.mockReset();
    hardDeletePromotionMock.mockReset();
    recordAuditMock.mockReset();
    hardDeletePromotionMock.mockResolvedValue(undefined);
  });

  it("refuse un utilisateur non authentifié", async () => {
    authMock.mockResolvedValue(null);
    const result = await hardDeletePromotionAction("promo-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("UNAUTHENTICATED");
    expect(hardDeletePromotionMock).not.toHaveBeenCalled();
  });

  it("§24 : refuse EDITOR (« suppression refusée EDITOR »)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const result = await hardDeletePromotionAction("promo-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
    expect(hardDeletePromotionMock).not.toHaveBeenCalled();
  });

  it("refuse ADMIN — la suppression définitive reste réservée à SUPER_ADMIN (§22)", async () => {
    authMock.mockResolvedValue(sessionFor("ADMIN"));
    const result = await hardDeletePromotionAction("promo-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
    expect(hardDeletePromotionMock).not.toHaveBeenCalled();
  });

  it("autorise SUPER_ADMIN et journalise l'action (§18)", async () => {
    authMock.mockResolvedValue(sessionFor("SUPER_ADMIN"));
    const result = await hardDeletePromotionAction("promo-1");
    expect(result.success).toBe(true);
    expect(hardDeletePromotionMock).toHaveBeenCalledWith("promo-1");
    expect(recordAuditMock).toHaveBeenCalledWith(expect.objectContaining({ role: "SUPER_ADMIN" }), "promotion.hardDelete", "Promotion", "promo-1");
  });
});

describe("archivePromotionAction (Phase 9, §22) — désactivation (deactivate)", () => {
  beforeEach(() => {
    authMock.mockReset();
    archivePromotionMock.mockReset();
    recordAuditMock.mockReset();
    archivePromotionMock.mockResolvedValue(undefined);
  });

  it("§24 : refuse EDITOR (deactivate non accordé à ce rôle)", async () => {
    authMock.mockResolvedValue(sessionFor("EDITOR"));
    const result = await archivePromotionAction("promo-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("FORBIDDEN");
    expect(archivePromotionMock).not.toHaveBeenCalled();
  });

  it("autorise ADMIN", async () => {
    authMock.mockResolvedValue(sessionFor("ADMIN"));
    const result = await archivePromotionAction("promo-1");
    expect(result.success).toBe(true);
    expect(archivePromotionMock).toHaveBeenCalledWith("promo-1");
  });
});

describe("updatePromotionAction (Phase 9, §17) — concurrence d'édition", () => {
  beforeEach(() => {
    authMock.mockReset();
    updatePromotionMock.mockReset();
    recordAuditMock.mockReset();
    authMock.mockResolvedValue(sessionFor("SUPER_ADMIN"));
  });

  it("propage un conflit de version en CONFLICT plutôt que d'écraser silencieusement, sans audit de succès", async () => {
    const { AdminConflictError } = await import("@/lib/admin/mutation-result");
    updatePromotionMock.mockRejectedValue(new AdminConflictError());

    // Phase 11, §16ter — le second argument est désormais un `version` entier
    // (source de vérité unique pour la concurrence), plus une chaîne ISO
    // `updatedAt` ; la valeur exacte n'a pas d'importance ici puisque
    // `updatePromotionMock` est un remplaçant intégralement simulé de la
    // couche service (pas la logique réelle), seul le type compte.
    const result = await updatePromotionAction("promo-1", 1, VALID_PROMOTION_PAYLOAD);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe("CONFLICT");
    // Phase 11 (§16, exigence explicite "no success audit on conflict") :
    // un conflit de concurrence ne doit JAMAIS déclencher l'audit de succès
    // — sinon le journal enregistrerait une mutation qui n'a en réalité
    // jamais été appliquée.
    expect(recordAuditMock).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// `vi.mock()` est hissé par Vitest au tout début du fichier — au-dessus même
// des déclarations `const` qui le précèdent textuellement. Référencer un
// `const xMock = vi.fn()` déclaré juste avant depuis l'intérieur d'une
// factory `vi.mock()` lève donc `ReferenceError: Cannot access 'x' before
// initialization`. `vi.hoisted()` exécute son callback avant ce hissage,
// ce qui rend les mocks disponibles au bon moment.
const { prismaMock, invalidateCacheMock } = vi.hoisted(() => {
  const prismaMock: {
    promotion: Record<string, ReturnType<typeof vi.fn>>;
    promotionBranch: Record<string, ReturnType<typeof vi.fn>>;
    promotionTranslation: Record<string, ReturnType<typeof vi.fn>>;
    branch: Record<string, ReturnType<typeof vi.fn>>;
    $transaction: ReturnType<typeof vi.fn>;
  } = {
    promotion: {
      create: vi.fn(),
      update: vi.fn(),
      // Phase 11, §16ter — verrou de concurrence atomique basé sur `version`
      // (remplace le verrou `updatedAt` du même phase) : `{ count: 1 }` par
      // défaut ("une ligne correspondait à la version attendue"),
      // surchargeable par test pour simuler un conflit (`{ count: 0 }`).
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    promotionBranch: { deleteMany: vi.fn() },
    promotionTranslation: { deleteMany: vi.fn() },
    branch: { findMany: vi.fn() },
    // Phase 11, §16 — `updatePromotion`/`hardDeletePromotion` enveloppent
    // désormais leurs suppressions + écriture dans `prisma.$transaction`
    // (voir le correctif dans `services/admin/promotion-admin.service.ts`) :
    // ce mock invoque réellement le callback reçu avec `prismaMock`
    // lui-même comme `tx`, pour que toutes les assertions existantes sur
    // `prismaMock.promotion.*`/`promotionBranch.*`/`promotionTranslation.*`
    // continuent de fonctionner sans changement (même mock, transaction ou
    // non — même principe que `import-service.test.ts`).
    $transaction: vi.fn(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)),
  };
  return { prismaMock, invalidateCacheMock: vi.fn() };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/admin/cache", () => ({ invalidatePublicBranchCaches: invalidateCacheMock }));

import {
  createPromotion,
  hardDeletePromotion,
  updatePromotion,
} from "@/services/admin/promotion-admin.service";
import { AdminConflictError, AdminNotFoundError } from "@/lib/admin/mutation-result";
import type { PromotionInput } from "@/lib/validators/promotion";

function makeInput(overrides: Partial<PromotionInput> = {}): PromotionInput {
  return {
    slug: "fresh-chicken-ramot",
    image: null,
    price: "29.90",
    originalPrice: "39.90",
    currency: "ILS",
    unit: "KG",
    startDate: new Date("2026-08-25"),
    endDate: new Date("2026-09-03"),
    url: null,
    status: "ACTIVE",
    appliesToAll: false,
    branchIds: ["branch-1"],
    isFeatured: true,
    priority: 10,
    translations: [{ locale: "he", productName: "עוף טרי", title: "מבצע היום", description: null, ctaLabel: null }],
    ...overrides,
  } as PromotionInput;
}

/**
 * Couche service Promotions (Phase 9, §12/§17/§25) — testée ici en isolant
 * `prisma` : couvre spécifiquement les points du §25 qui ne peuvent pas être
 * vérifiés au seul niveau du schéma Zod (nettoyage effectif des relations en
 * base, concurrence d'édition, invalidation de cache après mutation).
 */
describe("createPromotion (Phase 9, §12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.promotion.create.mockResolvedValue({ id: "promo-1" });
    prismaMock.branch.findMany.mockResolvedValue([{ slug: "jerusalem-ramot" }]);
  });

  it("omet entièrement `branches` de la création quand appliesToAll est vrai (§12 : aucune PromotionBranch résiduelle)", async () => {
    await createPromotion(makeInput({ appliesToAll: true, branchIds: [] }));
    const callArgs = prismaMock.promotion.create.mock.calls[0][0];
    expect(callArgs.data.branches).toBeUndefined();
  });

  it("crée les liens PromotionBranch quand appliesToAll est faux", async () => {
    await createPromotion(makeInput({ appliesToAll: false, branchIds: ["branch-1", "branch-2"] }));
    const callArgs = prismaMock.promotion.create.mock.calls[0][0];
    expect(callArgs.data.branches).toEqual({ create: [{ branchId: "branch-1" }, { branchId: "branch-2" }] });
  });

  it("invalide le cache public après création (§20)", async () => {
    await createPromotion(makeInput());
    expect(invalidateCacheMock).toHaveBeenCalled();
  });
});

describe("updatePromotion (Phase 9, §12/§17 ; Phase 11, §16ter) — nettoyage des relations et concurrence par version", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.promotion.findUnique.mockResolvedValue({ version: 5 });
    prismaMock.promotion.update.mockResolvedValue({ id: "promo-1" });
    prismaMock.branch.findMany.mockResolvedValue([]);
  });

  it("§12 : purge TOUJOURS les anciennes relations PromotionBranch avant de basculer en globale", async () => {
    await updatePromotion("promo-1", 5, makeInput({ appliesToAll: true, branchIds: [] }));

    expect(prismaMock.promotionBranch.deleteMany).toHaveBeenCalledWith({ where: { promotionId: "promo-1" } });
    const updateArgs = prismaMock.promotion.update.mock.calls[0][0];
    // Aucune recréation : la promotion devenue globale ne référence plus aucun magasin spécifique.
    expect(updateArgs.data.branches).toBeUndefined();
  });

  it("Phase 11, §16 (régression) : la purge + mise à jour passe par prisma.$transaction, jamais des appels indépendants", async () => {
    await updatePromotion("promo-1", 5, makeInput());
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("§17 : lève AdminConflictError si version ne correspond plus (écrasement silencieux interdit)", async () => {
    await expect(updatePromotion("promo-1", 4, makeInput())).rejects.toBeInstanceOf(AdminConflictError);
    expect(prismaMock.promotion.update).not.toHaveBeenCalled();
  });

  it("lève AdminNotFoundError si la promotion n'existe plus", async () => {
    prismaMock.promotion.findUnique.mockResolvedValue(null);
    await expect(updatePromotion("missing", 5, makeInput())).rejects.toBeInstanceOf(AdminNotFoundError);
  });

  it("Phase 11, §16 (régression) : un échec après la suppression des relations enfant fait tout échouer, la mise à jour finale n'a jamais lieu", async () => {
    prismaMock.promotionBranch.deleteMany.mockRejectedValueOnce(new Error("DB connection lost"));

    await expect(updatePromotion("promo-1", 5, makeInput())).rejects.toThrow("DB connection lost");

    // La mise à jour finale ne doit JAMAIS s'exécuter après l'échec d'une
    // purge précédente dans la même transaction — sinon une promotion réelle
    // se retrouverait sans traduction ni ciblage magasin, sans qu'aucune
    // nouvelle donnée n'ait été écrite en remplacement.
    expect(prismaMock.promotion.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("Phase 11, §16 (régression) : un échec pendant la recréation finale (promotion.update) n'invalide pas le cache", async () => {
    prismaMock.promotion.update.mockRejectedValueOnce(new Error("constraint violation"));

    await expect(updatePromotion("promo-1", 5, makeInput())).rejects.toThrow("constraint violation");

    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("§17 (régression) : un conflit de concurrence empêche TOUTE purge/modification et n'invalide pas le cache", async () => {
    prismaMock.promotion.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(updatePromotion("promo-1", 5, makeInput())).rejects.toBeInstanceOf(AdminConflictError);

    expect(prismaMock.promotionTranslation.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.promotionBranch.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.promotion.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("relations non affectées : la purge est scopée à la seule promotion ciblée (jamais une suppression globale)", async () => {
    await updatePromotion("promo-1", 5, makeInput());

    expect(prismaMock.promotionTranslation.deleteMany).toHaveBeenCalledWith({ where: { promotionId: "promo-1" } });
    expect(prismaMock.promotionBranch.deleteMany).toHaveBeenCalledWith({ where: { promotionId: "promo-1" } });
  });

  it("Phase 11, §16ter (régression) : le verrou incrémente `version` de façon atomique, jamais une valeur calculée côté JS", async () => {
    await updatePromotion("promo-1", 5, makeInput());

    expect(prismaMock.promotion.updateMany).toHaveBeenCalledWith({
      where: { id: "promo-1", version: 5 },
      data: { version: { increment: 1 }, updatedAt: expect.any(Date) },
    });
  });

  it("Phase 11, §16ter (régression, simulation deux clients — TOCTOU) : le verrou ATOMIQUE (pas seulement la pré-vérification) rejette le second client", async () => {
    // Simule un mini état serveur : la version "réellement en base" n'avance
    // QUE quand le verrou `updateMany` matche — exactement le comportement
    // Postgres réel (`WHERE version = ?` puis `increment` atomique).
    let serverVersion = 5;
    prismaMock.promotion.updateMany.mockImplementation(async ({ where }: { where: { version: number } }) => {
      if (where.version !== serverVersion) return { count: 0 };
      serverVersion += 1;
      return { count: 1 };
    });
    // Client A et Client B chargent TOUS DEUX la version 5 (T1) — la
    // pré-vérification externe de B verra donc AUSSI la version 5, PAS la
    // version 6 déjà committée par A : c'est exactement la fenêtre TOCTOU que
    // le verrou atomique (et non la pré-vérification) doit fermer.
    prismaMock.promotion.findUnique.mockResolvedValue({ version: 5 });

    // Client A mute avec succès en premier → la version serveur passe à 6.
    await updatePromotion("promo-1", 5, makeInput());
    expect(serverVersion).toBe(6);
    expect(prismaMock.promotionBranch.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.promotionTranslation.deleteMany).toHaveBeenCalledTimes(1);
    prismaMock.promotionBranch.deleteMany.mockClear();
    prismaMock.promotionTranslation.deleteMany.mockClear();
    prismaMock.promotion.update.mockClear();
    invalidateCacheMock.mockClear();

    // Client B soumet ENCORE la version 5 (T1, périmée) — sa PROPRE
    // pré-vérification lit aussi `{ version: 5 }` (mock inchangé, comme s'il
    // avait chargé la page avant le commit de A) : le pré-check seul NE PEUT
    // PAS détecter le conflit ici, seul le verrou atomique `updateMany`
    // (`WHERE version = 5` contre un serveur déjà à 6) le peut. B DOIT
    // recevoir un conflit, et AUCUNE relation enfant ne doit être touchée.
    await expect(updatePromotion("promo-1", 5, makeInput())).rejects.toBeInstanceOf(AdminConflictError);
    expect(prismaMock.promotionBranch.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.promotionTranslation.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.promotion.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });
});

describe("hardDeletePromotion (Phase 9, §22) — aucun cascade destructif silencieux", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.promotion.findUnique.mockResolvedValue({ appliesToAll: false, branches: [{ branchId: "branch-1" }] });
  });

  it("supprime explicitement les relations enfant AVANT la promotion elle-même", async () => {
    const callOrder: string[] = [];
    prismaMock.promotionBranch.deleteMany.mockImplementation(async () => {
      callOrder.push("branches");
    });
    prismaMock.promotionTranslation.deleteMany.mockImplementation(async () => {
      callOrder.push("translations");
    });
    prismaMock.promotion.update.mockImplementation(async () => {
      callOrder.push("promotion.update");
    });

    // `hardDeletePromotion` appelle `prisma.promotion.delete`, pas `.update` —
    // on vérifie ici uniquement l'ordre des suppressions enfant.
    prismaMock.promotion.findMany.mockResolvedValue([]);
    (prismaMock.promotion as unknown as { delete: ReturnType<typeof vi.fn> }).delete = vi.fn(async () => {
      callOrder.push("promotion.delete");
    });

    await hardDeletePromotion("promo-1");

    expect(callOrder.indexOf("branches")).toBeLessThan(callOrder.indexOf("promotion.delete"));
    expect(callOrder.indexOf("translations")).toBeLessThan(callOrder.indexOf("promotion.delete"));
    // Phase 11, §16 (régression) : les 3 opérations ci-dessus s'exécutent
    // toutes À L'INTÉRIEUR de prisma.$transaction — jamais 3 appels
    // indépendants qui pourraient laisser une promotion sans traduction ni
    // ciblage magasin si le processus s'interrompt entre deux d'entre elles.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("Phase 11, §16 (régression) : un échec pendant la purge empêche la suppression de la promotion et n'invalide pas le cache", async () => {
    prismaMock.promotionBranch.deleteMany.mockRejectedValueOnce(new Error("DB error"));
    (prismaMock.promotion as unknown as { delete: ReturnType<typeof vi.fn> }).delete = vi.fn();

    await expect(hardDeletePromotion("promo-1")).rejects.toThrow("DB error");

    expect(prismaMock.promotionTranslation.deleteMany).not.toHaveBeenCalled();
    expect((prismaMock.promotion as unknown as { delete: ReturnType<typeof vi.fn> }).delete).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });
});

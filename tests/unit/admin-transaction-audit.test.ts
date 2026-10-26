import { beforeEach, describe, expect, it, vi } from "vitest";
// NOTE : `AdminConflictError` n'est PAS importé statiquement en haut de ce
// fichier — contrairement à `admin-promotion-service.test.ts` où `vi.mock()`
// (hissé) s'applique globalement au fichier. Ici, chaque domaine remplace
// `@/lib/prisma` via `vi.doMock()` + `vi.resetModules()` dans son propre
// `beforeEach` (voir plus bas) : un `import` statique de
// `@/lib/admin/mutation-result` s'exécuterait AVANT tout `doMock`, chargerait
// la chaîne réelle `lib/auth/config.ts` → `admin-user.repository.prisma` →
// `@/lib/prisma` (le VRAI client, jamais généré dans ce bac à sable) et ferait
// échouer TOUT le fichier avec `Cannot find module '.prisma/client/default'`.
// On importe donc `AdminConflictError` dynamiquement, APRÈS `vi.doMock()`,
// exactement au même titre que le service testé — il hérite alors du même
// mock `@/lib/prisma` déjà en place pour ce test.

/**
 * Phase 11, §16 (audit transactions) — régression pour un défaut réel trouvé
 * pendant cette phase : `updateBranch`/`updateService`/`updateCity` (et leurs
 * équivalents `hardDeleteX`) enchaînaient plusieurs suppressions Prisma
 * (`deleteMany`) puis un `update`/`delete` final comme des appels
 * INDÉPENDANTS, jamais enveloppés dans `prisma.$transaction`. Un crash du
 * processus entre deux de ces appels laissait un enregistrement réel avec
 * ses relations enfant (traductions, horaires, services) supprimées mais
 * jamais recréées — un état incohérent persistant jusqu'à la prochaine
 * modification réussie. `updatePromotion`/`hardDeletePromotion` ont leur
 * propre régression équivalente dans `admin-promotion-service.test.ts`
 * (fichier déjà existant, Phase 9) ; ce fichier couvre les trois autres
 * domaines CRUD (magasins, services, villes), qui n'avaient encore aucun
 * test au niveau service avec `prisma` mocké.
 *
 * Phase 11, §16ter (durcissement de la concurrence optimiste) — ce fichier a
 * été converti d'un verrou basé sur `updatedAt` (chaîne ISO comparée dans un
 * `WHERE`) vers le verrou `version` (entier, source de vérité unique — voir
 * `admin-promotion-service.test.ts` pour la conversion de référence déjà
 * effectuée et vérifiée sur le domaine Promotions). Chaque mock
 * `findUnique` renvoie désormais `{ version: <n> }` au lieu de
 * `{ updatedAt: new Date(...) }`, et chaque appel `updateX(id, expectedVersion,
 * input)` passe un entier plutôt qu'une chaîne de date.
 *
 * Chaque `prismaMock.$transaction` ci-dessous invoque RÉELLEMENT le callback
 * reçu avec `prismaMock` lui-même comme `tx` (même principe que
 * `import-service.test.ts`/`admin-promotion-service.test.ts`) — ce qui
 * permet de vérifier à la fois que `$transaction` est bien utilisé ET que
 * les opérations qu'il contient produisent le même résultat qu'avant le
 * correctif.
 */

const { branchPrismaMock, servicePrismaMock, cityPrismaMock, invalidateCacheMock } = vi.hoisted(() => {
  function makeTransactionalMock<T extends Record<string, Record<string, ReturnType<typeof vi.fn>>>>(
    shape: T
  ): T & { $transaction: ReturnType<typeof vi.fn> } {
    const mock = shape as T & { $transaction: ReturnType<typeof vi.fn> };
    mock.$transaction = vi.fn(async (callback: (tx: typeof mock) => Promise<unknown>) => callback(mock));
    return mock;
  }

  return {
    branchPrismaMock: makeTransactionalMock({
      // Phase 11, §16ter — verrou de concurrence atomique basé sur `version` :
      // `updateMany` doit être stubbé ici car `updateBranch` l'appelle
      // désormais comme PREMIÈRE opération de la transaction (voir
      // `branch-admin.service.ts`). `{ count: 1 }` par défaut ("une ligne
      // correspondait à la version attendue"), surchargeable par test pour
      // simuler un conflit (`{ count: 0 }`).
      branch: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }), delete: vi.fn() },
      branchOpeningHours: { deleteMany: vi.fn() },
      specialOpeningHours: { deleteMany: vi.fn() },
      branchService: { deleteMany: vi.fn() },
      branchImage: { deleteMany: vi.fn() },
      branchTranslation: { deleteMany: vi.fn() },
      searchAlias: { deleteMany: vi.fn() },
    }),
    servicePrismaMock: makeTransactionalMock({
      service: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }), delete: vi.fn() },
      serviceTranslation: { deleteMany: vi.fn() },
      branchService: { count: vi.fn() },
    }),
    cityPrismaMock: makeTransactionalMock({
      city: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }), delete: vi.fn() },
      cityTranslation: { deleteMany: vi.fn() },
      branch: { count: vi.fn() },
    }),
    invalidateCacheMock: vi.fn(),
  };
});

// Trois modules distincts, chacun avec son propre mock `@/lib/prisma` — Vitest
// isole les mocks de module par fichier de test, donc les trois `import()`
// dynamiques ci-dessous (un par domaine) reçoivent chacun le mock voulu tant
// que le mock est déjà en place avant l'import. On importe donc les trois
// services depuis IMPORT_PATH différents mais on ne peut mocker
// "@/lib/prisma" qu'UNE fois par fichier de test avec `vi.mock` — on utilise
// donc `vi.doMock` + `await import()` pour rejouer un mock différent avant
// chaque import de service, dans trois blocs `describe` séquentiels.
vi.mock("@/lib/admin/cache", () => ({ invalidatePublicBranchCaches: invalidateCacheMock }));

// Entrée valide réutilisée par tous les tests `updateBranch` de ce fichier —
// factorisée pour que les nouveaux tests de régression (rollback, conflit de
// concurrence, portée des relations) n'aient pas à redupliquer ce littéral.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VALID_BRANCH_INPUT: any = {
  slug: "jerusalem-ramot",
  branchCode: "JLM-01",
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

describe("updateBranch/hardDeleteBranch (Phase 11, §16 régression)", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doMock("@/lib/prisma", () => ({ prisma: branchPrismaMock }));
  });

  it("updateBranch enveloppe les 5 purges + la mise à jour dans prisma.$transaction", async () => {
    const { updateBranch } = await import("@/services/admin/branch-admin.service");
    branchPrismaMock.branch.findUnique.mockResolvedValue({
      version: 5,
      slug: "jerusalem-ramot",
    });
    branchPrismaMock.branch.update.mockResolvedValue({ id: "branch-1" });

    await updateBranch("branch-1", 5, VALID_BRANCH_INPUT);

    expect(branchPrismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(branchPrismaMock.branchOpeningHours.deleteMany).toHaveBeenCalledWith({ where: { branchId: "branch-1" } });
    expect(branchPrismaMock.branch.update).toHaveBeenCalledTimes(1);
  });

  it("hardDeleteBranch enveloppe les 6 purges + la suppression dans prisma.$transaction", async () => {
    const { hardDeleteBranch } = await import("@/services/admin/branch-admin.service");
    branchPrismaMock.branch.findUnique.mockResolvedValue({ slug: "jerusalem-ramot", promotions: [] });

    await hardDeleteBranch("branch-1");

    expect(branchPrismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(branchPrismaMock.branch.delete).toHaveBeenCalledWith({ where: { id: "branch-1" } });
  });

  it("rollback : un échec pendant la purge (ex. branchService.deleteMany) empêche la mise à jour finale et n'invalide pas le cache", async () => {
    const { updateBranch } = await import("@/services/admin/branch-admin.service");
    branchPrismaMock.branch.findUnique.mockResolvedValue({
      version: 5,
      slug: "jerusalem-ramot",
    });
    branchPrismaMock.branchService.deleteMany.mockRejectedValueOnce(new Error("DB connection lost"));

    await expect(updateBranch("branch-1", 5, VALID_BRANCH_INPUT)).rejects.toThrow("DB connection lost");

    // La purge suivante (images) et la mise à jour finale ne doivent JAMAIS
    // s'exécuter après l'échec d'une opération précédente dans la même
    // transaction — sinon un magasin réel se retrouverait avec certaines
    // relations supprimées mais aucune nouvelle donnée écrite : exactement
    // l'état incohérent que Phase 11 §16 corrige.
    expect(branchPrismaMock.branchImage.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branch.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("rollback : un échec pendant la recréation finale (branch.update) n'invalide pas le cache", async () => {
    const { updateBranch } = await import("@/services/admin/branch-admin.service");
    branchPrismaMock.branch.findUnique.mockResolvedValue({
      version: 5,
      slug: "jerusalem-ramot",
    });
    branchPrismaMock.branch.update.mockRejectedValueOnce(new Error("constraint violation"));

    await expect(updateBranch("branch-1", 5, VALID_BRANCH_INPUT)).rejects.toThrow("constraint violation");

    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("conflit de concurrence (§17) : le verrou atomique empêche TOUTE purge/modification et n'invalide pas le cache", async () => {
    const { updateBranch } = await import("@/services/admin/branch-admin.service");
    const { AdminConflictError } = await import("@/lib/admin/mutation-result");
    branchPrismaMock.branch.findUnique.mockResolvedValue({
      version: 5,
      slug: "jerusalem-ramot",
    });
    branchPrismaMock.branch.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(updateBranch("branch-1", 5, VALID_BRANCH_INPUT)).rejects.toBeInstanceOf(AdminConflictError);

    expect(branchPrismaMock.branchOpeningHours.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.specialOpeningHours.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branchService.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branchImage.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branchTranslation.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branch.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("relations non affectées : chaque purge est scopée au seul magasin ciblé (jamais une suppression globale)", async () => {
    const { updateBranch } = await import("@/services/admin/branch-admin.service");
    branchPrismaMock.branch.findUnique.mockResolvedValue({
      version: 5,
      slug: "jerusalem-ramot",
    });

    await updateBranch("branch-1", 5, VALID_BRANCH_INPUT);

    expect(branchPrismaMock.branchOpeningHours.deleteMany).toHaveBeenCalledWith({ where: { branchId: "branch-1" } });
    expect(branchPrismaMock.specialOpeningHours.deleteMany).toHaveBeenCalledWith({ where: { branchId: "branch-1" } });
    expect(branchPrismaMock.branchService.deleteMany).toHaveBeenCalledWith({ where: { branchId: "branch-1" } });
    expect(branchPrismaMock.branchImage.deleteMany).toHaveBeenCalledWith({ where: { branchId: "branch-1" } });
    expect(branchPrismaMock.branchTranslation.deleteMany).toHaveBeenCalledWith({ where: { branchId: "branch-1" } });
  });

  it("rollback (hardDelete) : un échec pendant la purge empêche la suppression du magasin et n'invalide pas le cache", async () => {
    const { hardDeleteBranch } = await import("@/services/admin/branch-admin.service");
    branchPrismaMock.branch.findUnique.mockResolvedValue({ slug: "jerusalem-ramot", promotions: [] });
    branchPrismaMock.branchTranslation.deleteMany.mockRejectedValueOnce(new Error("DB error"));

    await expect(hardDeleteBranch("branch-1")).rejects.toThrow("DB error");

    expect(branchPrismaMock.searchAlias.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branch.delete).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("Phase 11, §16ter (régression) : le verrou incrémente `version` de façon atomique, jamais une valeur calculée côté JS", async () => {
    const { updateBranch } = await import("@/services/admin/branch-admin.service");
    branchPrismaMock.branch.findUnique.mockResolvedValue({ version: 5, slug: "jerusalem-ramot" });

    await updateBranch("branch-1", 5, VALID_BRANCH_INPUT);

    expect(branchPrismaMock.branch.updateMany).toHaveBeenCalledWith({
      where: { id: "branch-1", version: 5 },
      data: { version: { increment: 1 }, updatedAt: expect.any(Date) },
    });
  });

  it("Phase 11, §16ter (régression, simulation deux clients — TOCTOU) : le verrou ATOMIQUE (pas seulement la pré-vérification) rejette le second client", async () => {
    // Simule un mini état serveur : la version "réellement en base" n'avance
    // QUE quand le verrou `updateMany` matche — exactement le comportement
    // Postgres réel (`WHERE version = ?` puis `increment` atomique).
    let serverVersion = 5;
    branchPrismaMock.branch.updateMany.mockImplementation(async ({ where }: { where: { version: number } }) => {
      if (where.version !== serverVersion) return { count: 0 };
      serverVersion += 1;
      return { count: 1 };
    });
    // Client A et Client B chargent TOUS DEUX la version 5 (T1) — la
    // pré-vérification externe de B verra donc AUSSI la version 5, PAS la
    // version 6 déjà committée par A : c'est exactement la fenêtre TOCTOU que
    // le verrou atomique (et non la pré-vérification) doit fermer.
    branchPrismaMock.branch.findUnique.mockResolvedValue({ version: 5, slug: "jerusalem-ramot" });

    const { updateBranch } = await import("@/services/admin/branch-admin.service");

    // Client A mute avec succès en premier → la version serveur passe à 6.
    await updateBranch("branch-1", 5, VALID_BRANCH_INPUT);
    expect(serverVersion).toBe(6);
    expect(branchPrismaMock.branchOpeningHours.deleteMany).toHaveBeenCalledTimes(1);
    expect(branchPrismaMock.branchTranslation.deleteMany).toHaveBeenCalledTimes(1);
    branchPrismaMock.branchOpeningHours.deleteMany.mockClear();
    branchPrismaMock.specialOpeningHours.deleteMany.mockClear();
    branchPrismaMock.branchService.deleteMany.mockClear();
    branchPrismaMock.branchImage.deleteMany.mockClear();
    branchPrismaMock.branchTranslation.deleteMany.mockClear();
    branchPrismaMock.branch.update.mockClear();
    invalidateCacheMock.mockClear();

    // Client B soumet ENCORE la version 5 (T1, périmée) — sa PROPRE
    // pré-vérification lit aussi `{ version: 5 }` (mock inchangé, comme s'il
    // avait chargé la page avant le commit de A) : le pré-check seul NE PEUT
    // PAS détecter le conflit ici, seul le verrou atomique `updateMany`
    // (`WHERE version = 5` contre un serveur déjà à 6) le peut. B DOIT
    // recevoir un conflit, et AUCUNE relation enfant ne doit être touchée.
    const { AdminConflictError } = await import("@/lib/admin/mutation-result");
    await expect(updateBranch("branch-1", 5, VALID_BRANCH_INPUT)).rejects.toBeInstanceOf(AdminConflictError);
    expect(branchPrismaMock.branchOpeningHours.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.specialOpeningHours.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branchService.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branchImage.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branchTranslation.deleteMany).not.toHaveBeenCalled();
    expect(branchPrismaMock.branch.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });
});

describe("updateService/hardDeleteService (Phase 11, §16 régression)", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doMock("@/lib/prisma", () => ({ prisma: servicePrismaMock }));
  });

  it("updateService enveloppe la purge + la mise à jour dans prisma.$transaction", async () => {
    const { updateService } = await import("@/services/admin/service-admin.service");
    servicePrismaMock.service.findUnique.mockResolvedValue({ version: 5 });
    servicePrismaMock.service.update.mockResolvedValue({ id: "service-1" });

    await updateService("service-1", 5, {
      slug: "delivery",
      icon: "truck",
      isActive: true,
      sortOrder: 0,
      translations: [{ locale: "he", name: "משלוח", description: null }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(servicePrismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(servicePrismaMock.serviceTranslation.deleteMany).toHaveBeenCalledWith({ where: { serviceId: "service-1" } });
  });

  it("hardDeleteService enveloppe la purge + la suppression dans prisma.$transaction", async () => {
    const { hardDeleteService } = await import("@/services/admin/service-admin.service");
    servicePrismaMock.branchService.count.mockResolvedValue(0);
    servicePrismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });

    await hardDeleteService("service-1");

    expect(servicePrismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(servicePrismaMock.service.delete).toHaveBeenCalledWith({ where: { id: "service-1" } });
  });

  it("rollback : un échec pendant la purge des traductions empêche la mise à jour finale et n'invalide pas le cache", async () => {
    const { updateService } = await import("@/services/admin/service-admin.service");
    servicePrismaMock.service.findUnique.mockResolvedValue({ version: 5 });
    servicePrismaMock.serviceTranslation.deleteMany.mockRejectedValueOnce(new Error("DB connection lost"));

    await expect(
      updateService("service-1", 5, {
        slug: "delivery",
        icon: "truck",
        isActive: true,
        sortOrder: 0,
        translations: [{ locale: "he", name: "משלוח", description: null }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    ).rejects.toThrow("DB connection lost");

    expect(servicePrismaMock.service.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("conflit de concurrence (§17) : le verrou atomique empêche TOUTE purge/modification et n'invalide pas le cache", async () => {
    const { updateService } = await import("@/services/admin/service-admin.service");
    const { AdminConflictError } = await import("@/lib/admin/mutation-result");
    servicePrismaMock.service.findUnique.mockResolvedValue({ version: 5 });
    servicePrismaMock.service.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      updateService("service-1", 5, {
        slug: "delivery",
        icon: "truck",
        isActive: true,
        sortOrder: 0,
        translations: [{ locale: "he", name: "משלוח", description: null }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    ).rejects.toBeInstanceOf(AdminConflictError);

    expect(servicePrismaMock.serviceTranslation.deleteMany).not.toHaveBeenCalled();
    expect(servicePrismaMock.service.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("rollback (hardDelete) : un échec pendant la purge empêche la suppression du service et n'invalide pas le cache", async () => {
    const { hardDeleteService } = await import("@/services/admin/service-admin.service");
    servicePrismaMock.branchService.count.mockResolvedValue(0);
    servicePrismaMock.service.findUnique.mockResolvedValue({ id: "service-1" });
    servicePrismaMock.serviceTranslation.deleteMany.mockRejectedValueOnce(new Error("DB error"));

    await expect(hardDeleteService("service-1")).rejects.toThrow("DB error");

    expect(servicePrismaMock.service.delete).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("Phase 11, §16ter (régression) : le verrou incrémente `version` de façon atomique, jamais une valeur calculée côté JS", async () => {
    const { updateService } = await import("@/services/admin/service-admin.service");
    servicePrismaMock.service.findUnique.mockResolvedValue({ version: 5 });

    await updateService("service-1", 5, {
      slug: "delivery",
      icon: "truck",
      isActive: true,
      sortOrder: 0,
      translations: [{ locale: "he", name: "משלוח", description: null }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(servicePrismaMock.service.updateMany).toHaveBeenCalledWith({
      where: { id: "service-1", version: 5 },
      data: { version: { increment: 1 }, updatedAt: expect.any(Date) },
    });
  });

  it("Phase 11, §16ter (régression, simulation deux clients — TOCTOU) : le verrou ATOMIQUE (pas seulement la pré-vérification) rejette le second client", async () => {
    let serverVersion = 5;
    servicePrismaMock.service.updateMany.mockImplementation(async ({ where }: { where: { version: number } }) => {
      if (where.version !== serverVersion) return { count: 0 };
      serverVersion += 1;
      return { count: 1 };
    });
    servicePrismaMock.service.findUnique.mockResolvedValue({ version: 5 });

    const { updateService } = await import("@/services/admin/service-admin.service");
    const input = {
      slug: "delivery",
      icon: "truck",
      isActive: true,
      sortOrder: 0,
      translations: [{ locale: "he", name: "משלוח", description: null }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Client A mute avec succès en premier → la version serveur passe à 6.
    await updateService("service-1", 5, input);
    expect(serverVersion).toBe(6);
    expect(servicePrismaMock.serviceTranslation.deleteMany).toHaveBeenCalledTimes(1);
    servicePrismaMock.serviceTranslation.deleteMany.mockClear();
    servicePrismaMock.service.update.mockClear();
    invalidateCacheMock.mockClear();

    // Client B soumet ENCORE la version 5 (T1, périmée) — même fenêtre TOCTOU
    // que le test équivalent du domaine magasins ci-dessus.
    const { AdminConflictError } = await import("@/lib/admin/mutation-result");
    await expect(updateService("service-1", 5, input)).rejects.toBeInstanceOf(AdminConflictError);
    expect(servicePrismaMock.serviceTranslation.deleteMany).not.toHaveBeenCalled();
    expect(servicePrismaMock.service.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });
});

describe("updateCity/hardDeleteCity (Phase 11, §16 régression)", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doMock("@/lib/prisma", () => ({ prisma: cityPrismaMock }));
  });

  it("updateCity enveloppe la purge + la mise à jour dans prisma.$transaction", async () => {
    const { updateCity } = await import("@/services/admin/city-admin.service");
    cityPrismaMock.city.findUnique.mockResolvedValue({ version: 5 });
    cityPrismaMock.city.update.mockResolvedValue({ id: "city-1" });

    await updateCity("city-1", 5, {
      slug: "jerusalem",
      latitude: 31.78,
      longitude: 35.22,
      isActive: true,
      sortOrder: 0,
      translations: [{ locale: "he", name: "ירושלים" }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(cityPrismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(cityPrismaMock.cityTranslation.deleteMany).toHaveBeenCalledWith({ where: { cityId: "city-1" } });
  });

  it("hardDeleteCity enveloppe la purge + la suppression dans prisma.$transaction", async () => {
    const { hardDeleteCity } = await import("@/services/admin/city-admin.service");
    cityPrismaMock.branch.count.mockResolvedValue(0);
    cityPrismaMock.city.findUnique.mockResolvedValue({ id: "city-1" });

    await hardDeleteCity("city-1");

    expect(cityPrismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(cityPrismaMock.city.delete).toHaveBeenCalledWith({ where: { id: "city-1" } });
  });

  it("rollback : un échec pendant la purge des traductions empêche la mise à jour finale et n'invalide pas le cache", async () => {
    const { updateCity } = await import("@/services/admin/city-admin.service");
    cityPrismaMock.city.findUnique.mockResolvedValue({ version: 5 });
    cityPrismaMock.cityTranslation.deleteMany.mockRejectedValueOnce(new Error("DB connection lost"));

    await expect(
      updateCity("city-1", 5, {
        slug: "jerusalem",
        latitude: 31.78,
        longitude: 35.22,
        isActive: true,
        sortOrder: 0,
        translations: [{ locale: "he", name: "ירושלים" }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    ).rejects.toThrow("DB connection lost");

    expect(cityPrismaMock.city.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("conflit de concurrence (§17) : le verrou atomique empêche TOUTE purge/modification et n'invalide pas le cache", async () => {
    const { updateCity } = await import("@/services/admin/city-admin.service");
    const { AdminConflictError } = await import("@/lib/admin/mutation-result");
    cityPrismaMock.city.findUnique.mockResolvedValue({ version: 5 });
    cityPrismaMock.city.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      updateCity("city-1", 5, {
        slug: "jerusalem",
        latitude: 31.78,
        longitude: 35.22,
        isActive: true,
        sortOrder: 0,
        translations: [{ locale: "he", name: "ירושלים" }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    ).rejects.toBeInstanceOf(AdminConflictError);

    expect(cityPrismaMock.cityTranslation.deleteMany).not.toHaveBeenCalled();
    expect(cityPrismaMock.city.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("rollback (hardDelete) : un échec pendant la purge empêche la suppression de la ville et n'invalide pas le cache", async () => {
    const { hardDeleteCity } = await import("@/services/admin/city-admin.service");
    cityPrismaMock.branch.count.mockResolvedValue(0);
    cityPrismaMock.city.findUnique.mockResolvedValue({ id: "city-1" });
    cityPrismaMock.cityTranslation.deleteMany.mockRejectedValueOnce(new Error("DB error"));

    await expect(hardDeleteCity("city-1")).rejects.toThrow("DB error");

    expect(cityPrismaMock.city.delete).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });

  it("Phase 11, §16ter (régression) : le verrou incrémente `version` de façon atomique, jamais une valeur calculée côté JS", async () => {
    const { updateCity } = await import("@/services/admin/city-admin.service");
    cityPrismaMock.city.findUnique.mockResolvedValue({ version: 5 });

    await updateCity("city-1", 5, {
      slug: "jerusalem",
      latitude: 31.78,
      longitude: 35.22,
      isActive: true,
      sortOrder: 0,
      translations: [{ locale: "he", name: "ירושלים" }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(cityPrismaMock.city.updateMany).toHaveBeenCalledWith({
      where: { id: "city-1", version: 5 },
      data: { version: { increment: 1 }, updatedAt: expect.any(Date) },
    });
  });

  it("Phase 11, §16ter (régression, simulation deux clients — TOCTOU) : le verrou ATOMIQUE (pas seulement la pré-vérification) rejette le second client", async () => {
    let serverVersion = 5;
    cityPrismaMock.city.updateMany.mockImplementation(async ({ where }: { where: { version: number } }) => {
      if (where.version !== serverVersion) return { count: 0 };
      serverVersion += 1;
      return { count: 1 };
    });
    cityPrismaMock.city.findUnique.mockResolvedValue({ version: 5 });

    const { updateCity } = await import("@/services/admin/city-admin.service");
    const input = {
      slug: "jerusalem",
      latitude: 31.78,
      longitude: 35.22,
      isActive: true,
      sortOrder: 0,
      translations: [{ locale: "he", name: "ירושלים" }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Client A mute avec succès en premier → la version serveur passe à 6.
    await updateCity("city-1", 5, input);
    expect(serverVersion).toBe(6);
    expect(cityPrismaMock.cityTranslation.deleteMany).toHaveBeenCalledTimes(1);
    cityPrismaMock.cityTranslation.deleteMany.mockClear();
    cityPrismaMock.city.update.mockClear();
    invalidateCacheMock.mockClear();

    // Client B soumet ENCORE la version 5 (T1, périmée) — même fenêtre TOCTOU
    // que les tests équivalents des domaines magasins/services ci-dessus.
    const { AdminConflictError } = await import("@/lib/admin/mutation-result");
    await expect(updateCity("city-1", 5, input)).rejects.toBeInstanceOf(AdminConflictError);
    expect(cityPrismaMock.cityTranslation.deleteMany).not.toHaveBeenCalled();
    expect(cityPrismaMock.city.update).not.toHaveBeenCalled();
    expect(invalidateCacheMock).not.toHaveBeenCalled();
  });
});

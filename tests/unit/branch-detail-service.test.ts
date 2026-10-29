import { describe, expect, it, vi } from "vitest";

import { getBranchDetailBySlug, getBranchLocatorData } from "@/services/branch.service";
import type { BranchRepository, RawBranch, RawPromotion } from "@/services/branch.repository";

// `services/branch.service.ts` importe `prismaBranchRepository`
// (`branch.repository.prisma.ts`), qui importe `lib/prisma.ts`, qui importe
// `@prisma/client` — indisponible dans ce bac à sable (`prisma generate`
// bloqué par la politique réseau, voir le résumé de Phase 3). Ce test appelle
// TOUJOURS `getBranchDetailBySlug()` avec un repository explicite (jamais la
// valeur par défaut), donc ce mock (hissé au tout début du fichier par
// Vitest, quelle que soit sa position textuelle) n'a besoin d'exporter qu'un
// espace réservé qui ne plante pas à l'import — aucune implémentation réelle
// n'est requise.
vi.mock("@/services/branch.repository.prisma", () => ({
  prismaBranchRepository: {},
}));

function makePromotion(overrides: Partial<RawPromotion> & { id: string }): RawPromotion {
  return {
    slug: overrides.id,
    image: null,
    price: null,
    originalPrice: null,
    currency: "ILS",
    unit: "UNIT",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    url: null,
    status: "ACTIVE",
    appliesToAll: true,
    isFeatured: false,
    priority: 0,
    translations: [
      { locale: "he", productName: null, title: "מבצע", description: null, ctaLabel: null },
      { locale: "en", productName: null, title: "Promotion", description: null, ctaLabel: null },
    ],
    ...overrides,
  };
}

function makeRawBranch(overrides: Partial<RawBranch> = {}): RawBranch {
  return {
    id: "branch-1",
    slug: "jerusalem-ramot",
    branchCode: "JLM-01",
    district: null,
    address: "Ramot Blvd 1",
    postalCode: "9721000",
    latitude: 31.8,
    longitude: 35.2,
    phone: "+972-2-1234567",
    email: "ramot@maayan2000.co.il",
    whatsappNumber: "+972501234567",
    whatsappGroupUrl: null,
    wazeUrlOverride: null,
    mainImage: null,
    isActive: true,
    isDemo: true,
    sortOrder: 0,
    city: {
      id: "jerusalem",
      slug: "jerusalem",
      latitude: 31.78,
      longitude: 35.22,
      translations: [
        { locale: "he", name: "ירושלים" },
        { locale: "en", name: "Jerusalem" },
      ],
    },
    translations: [
      { locale: "he", displayName: "מעיין 2000 – רמות", description: "תיאור בעברית", seoTitle: null, seoDescription: null },
      { locale: "en", displayName: "Maayan 2000 – Ramot", description: "English description", seoTitle: "Custom SEO title", seoDescription: null },
    ],
    services: [],
    openingHours: [
      { dayOfWeek: 0, isClosed: false, openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null },
    ],
    specialHours: [],
    searchAliases: [],
    images: [{ imageUrl: "https://cdn.example.com/ramot.jpg", alt: "Ramot branch", sortOrder: 0 }],
    promotions: [],
    reviewRating: { total: 0, averageRating: null },
    ...overrides,
  };
}

function makeFakeRepository(branch: RawBranch | null): BranchRepository {
  return {
    getActiveBranches: vi.fn().mockResolvedValue(branch ? [branch] : []),
    getBranchBySlug: vi.fn().mockResolvedValue(branch),
  };
}

describe("getBranchDetailBySlug (Phase 8, §1/§4/§11/§35)", () => {
  it("retourne null quand le repository ne trouve rien — la page appelle notFound() dans ce cas", async () => {
    const repository = makeFakeRepository(null);
    const result = await getBranchDetailBySlug("does-not-exist", "en", repository);
    expect(result).toBeNull();
    expect(repository.getBranchBySlug).toHaveBeenCalledWith("does-not-exist");
  });

  it("un seul appel repository pour toute la fiche — jamais plusieurs requêtes indépendantes depuis ce point d'entrée (§4)", async () => {
    const repository = makeFakeRepository(makeRawBranch());
    await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(repository.getBranchBySlug).toHaveBeenCalledTimes(1);
    expect(repository.getActiveBranches).not.toHaveBeenCalled();
  });

  it("localise displayName/description/seoTitle dans la langue demandée, avec repli hébreu si absent (§5)", async () => {
    const repository = makeFakeRepository(makeRawBranch());
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.displayName).toBe("Maayan 2000 – Ramot");
    expect(result?.description).toBe("English description");
    expect(result?.seoTitle).toBe("Custom SEO title");

    const heResult = await getBranchDetailBySlug("jerusalem-ramot", "he", repository);
    expect(heResult?.displayName).toBe("מעיין 2000 – רמות");
    // Pas de traduction russe fournie dans cette fixture → repli hébreu (§5).
    const ruResult = await getBranchDetailBySlug("jerusalem-ramot", "ru", repository);
    expect(ruResult?.displayName).toBe("מעיין 2000 – רמות");
  });

  it("inclut les champs propres à la fiche détaillée (postalCode, email, images...) absents de BranchSummary", async () => {
    const repository = makeFakeRepository(makeRawBranch());
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.postalCode).toBe("9721000");
    expect(result?.email).toBe("ramot@maayan2000.co.il");
    expect(result?.images).toEqual([{ imageUrl: "https://cdn.example.com/ramot.jpg", alt: "Ramot branch" }]);
  });

  it("ne conserve que les promotions actives (statut + date), réutilisant EXACTEMENT lib/promotions/filter (§11)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({ id: "active", startDate: "2026-06-01", endDate: "2026-06-30" }),
        makePromotion({ id: "expired", startDate: "2026-01-01", endDate: "2026-01-31" }),
        makePromotion({ id: "draft", status: "DRAFT" }),
      ],
    });
    const repository = makeFakeRepository(branch);

    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.promotions).toHaveLength(1);
    expect(result?.promotions[0].id).toBe("active");
    expect(result?.promotions[0].title).toBe("Promotion");

    vi.useRealTimers();
  });

  it("calcule un statut horaire cohérent (statusViewModel) via le moteur Phase 7, jamais recalculé autrement", async () => {
    vi.useFakeTimers();
    // La fixture n'a des horaires que pour dimanche (dayOfWeek 0) — 14 juin
    // 2026 est un dimanche, 12:00 à Jérusalem (été, UTC+3).
    vi.setSystemTime(new Date("2026-06-14T09:00:00.000Z"));

    const repository = makeFakeRepository(makeRawBranch());
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.statusViewModel.status).toBe("OPEN");
    expect(result?.status).toBe("OPEN");

    vi.useRealTimers();
  });

  it("passe intégralement le prix structuré (chaîne décimale, jamais un number) et le produit traduit (§1/§2/§15)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({
          id: "chicken",
          price: "29.90",
          originalPrice: "39.90",
          currency: "ILS",
          unit: "KG",
          isFeatured: true,
          priority: 10,
          translations: [
            { locale: "he", productName: "עוף טרי", title: "מבצע היום", description: null, ctaLabel: null },
            { locale: "en", productName: "Fresh chicken", title: "Today's Deal", description: null, ctaLabel: null },
          ],
        }),
      ],
    });
    const repository = makeFakeRepository(branch);
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.promotions[0].price).toBe("29.90");
    expect(typeof result?.promotions[0].price).toBe("string");
    expect(result?.promotions[0].originalPrice).toBe("39.90");
    expect(result?.promotions[0].productName).toBe("Fresh chicken");
    expect(result?.promotions[0].unit).toBe("KG");
    expect(result?.promotions[0].currency).toBe("ILS");

    vi.useRealTimers();
  });

  it("trie les promotions actives : locales avant globales, puis priority décroissant (§8)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({ id: "global-high-priority", appliesToAll: true, priority: 100 }),
        makePromotion({ id: "local-low-priority", appliesToAll: false, priority: 1 }),
        makePromotion({ id: "local-high-priority", appliesToAll: false, priority: 50 }),
      ],
    });
    const repository = makeFakeRepository(branch);
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.promotions.map((p) => p.id)).toEqual([
      "local-high-priority",
      "local-low-priority",
      "global-high-priority",
    ]);
  });

  it("`isLocalToBranch` reflète `appliesToAll` inversé, sans donnée supplémentaire (§8)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({ id: "global", appliesToAll: true }),
        makePromotion({ id: "local", appliesToAll: false }),
      ],
    });
    const repository = makeFakeRepository(branch);
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    const global = result?.promotions.find((p) => p.id === "global");
    const local = result?.promotions.find((p) => p.id === "local");
    expect(global?.isLocalToBranch).toBe(false);
    expect(local?.isLocalToBranch).toBe(true);
  });

  it("featuredPromotion : null quand aucune promotion active n'est isFeatured — jamais déduit de la simple activité (§10)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [makePromotion({ id: "active-not-featured", isFeatured: false })],
    });
    const repository = makeFakeRepository(branch);
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.featuredPromotion).toBeNull();
  });

  it("featuredPromotion : sélectionne la promotion featured+active la plus prioritaire (§10)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({ id: "featured-low", isFeatured: true, priority: 1 }),
        makePromotion({ id: "featured-high", isFeatured: true, priority: 10 }),
        makePromotion({ id: "not-featured", isFeatured: false, priority: 1000 }),
      ],
    });
    const repository = makeFakeRepository(branch);
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.featuredPromotion?.id).toBe("featured-high");
  });

  it("une promotion isFeatured mais SCHEDULED (future) n'apparaît jamais dans featuredPromotion (§10/§22)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({
          id: "future-featured",
          status: "SCHEDULED",
          isFeatured: true,
          startDate: "2026-07-01",
          endDate: "2026-07-31",
        }),
      ],
    });
    const repository = makeFakeRepository(branch);
    const result = await getBranchDetailBySlug("jerusalem-ramot", "en", repository);

    expect(result?.featuredPromotion).toBeNull();
    expect(result?.promotions).toHaveLength(0);
  });

  it("repli hébreu pour productName quand la traduction demandée est absente (§5/§15)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({
          id: "chicken",
          translations: [
            { locale: "he", productName: "עוף טרי", title: "מבצע היום", description: null, ctaLabel: null },
          ],
        }),
      ],
    });
    const repository = makeFakeRepository(branch);
    const ruResult = await getBranchDetailBySlug("jerusalem-ramot", "ru", repository);

    expect(ruResult?.promotions[0].productName).toBe("עוף טרי");
  });
});

describe("getBranchLocatorData — featuredPromotion par magasin (Phase 9, §10/§13)", () => {
  it("preserves the published rating aggregate through localization and search", async () => {
    const reviewRating = { total: 8, averageRating: 4.25 };
    const branch = makeRawBranch({ reviewRating });
    const repository = makeFakeRepository(branch);
    const list = await getBranchLocatorData({ locale: "he", q: "Ramot" }, repository);
    expect(list.branches[0].reviewRating).toEqual(reviewRating);
    expect((await getBranchDetailBySlug(branch.slug, "fr", repository))?.reviewRating).toEqual(reviewRating);
  });

  function makeMultiRepository(branches: RawBranch[]): BranchRepository {
    return {
      getActiveBranches: vi.fn().mockResolvedValue(branches),
      getBranchBySlug: vi.fn().mockResolvedValue(null),
    };
  }

  it("featuredPromotion reste null pour un magasin sans promotion featured active — BranchCard doit rester inchangée (§13)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({ promotions: [] });
    const repository = makeMultiRepository([branch]);
    const result = await getBranchLocatorData({ locale: "en" }, repository);

    expect(result.branches[0].featuredPromotion).toBeNull();

    vi.useRealTimers();
  });

  it("featuredPromotion privilégie la promotion locale featured sur une promotion globale featured (§8/§10)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00.000Z"));

    const branch = makeRawBranch({
      promotions: [
        makePromotion({ id: "global-featured", appliesToAll: true, isFeatured: true, priority: 100 }),
        makePromotion({ id: "local-featured", appliesToAll: false, isFeatured: true, priority: 1 }),
      ],
    });
    const repository = makeMultiRepository([branch]);
    const result = await getBranchLocatorData({ locale: "en" }, repository);

    expect(result.branches[0].featuredPromotion?.id).toBe("local-featured");

    vi.useRealTimers();
  });
});

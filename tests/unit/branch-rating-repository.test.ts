import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  branch: { findMany: vi.fn(), findFirst: vi.fn() },
  promotion: { findMany: vi.fn() },
  branchReview: { groupBy: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mocks }));
import { prismaBranchRepository } from "@/services/branch.repository.prisma";

function row(id: string) {
  return {
    id, slug: id, branchCode: id, district: null, address: "Address", postalCode: null,
    latitude: 31.8, longitude: 35.2, phone: null, email: null, whatsappNumber: null,
    whatsappGroupUrl: null, wazeUrlOverride: null, mainImage: null,
    isActive: true, isDemo: true, sortOrder: 0,
    city: { id: "city", slug: "city", latitude: 31.8, longitude: 35.2, translations: [] },
    translations: [], openingHours: [], specialHours: [], searchAliases: [], images: [], services: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.branch.findMany.mockResolvedValue([row("ramot"), row("talpiot")]);
  mocks.branch.findFirst.mockResolvedValue(row("ramot"));
  mocks.promotion.findMany.mockResolvedValue([]);
  mocks.branchReview.groupBy.mockResolvedValue([{ branchId: "ramot", _avg: { rating: 4.25 }, _count: { _all: 8 } }]);
});

describe("Published ratings loaded with branches", () => {
  it("loads one approved-only aggregate for all active branches, including the full review count", async () => {
    const branches = await prismaBranchRepository.getActiveBranches();
    expect(mocks.branchReview.groupBy).toHaveBeenCalledExactlyOnceWith({
      by: ["branchId"], where: { branchId: { in: ["ramot", "talpiot"] }, status: "APPROVED" },
      _avg: { rating: true }, _count: { _all: true },
    });
    expect(branches[0].reviewRating).toEqual({ total: 8, averageRating: 4.25 });
    expect(branches[1].reviewRating).toEqual({ total: 0, averageRating: null });
  });

  it("uses the same aggregate for an individual active branch", async () => {
    expect((await prismaBranchRepository.getBranchBySlug("ramot"))?.reviewRating).toEqual({ total: 8, averageRating: 4.25 });
    expect(mocks.branchReview.groupBy.mock.calls[0][0].where).toEqual({ branchId: { in: ["ramot"] }, status: "APPROVED" });
  });

  it("skips the aggregate when there are no active branches", async () => {
    mocks.branch.findMany.mockResolvedValue([]);
    expect(await prismaBranchRepository.getActiveBranches()).toEqual([]);
    expect(mocks.branchReview.groupBy).not.toHaveBeenCalled();
  });
});

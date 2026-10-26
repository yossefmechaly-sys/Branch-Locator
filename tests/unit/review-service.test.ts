import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  branch: { findFirst: vi.fn() },
  branchReview: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn(), create: vi.fn() },
  query: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  ...mocks, $transaction: async (fn: (tx: unknown) => unknown) => fn({ ...mocks, $queryRaw: mocks.query }),
} }));
import { getPublicBranchReviews, submitBranchReview, ReviewBranchNotFoundError, ReviewRateLimitError } from "@/services/review.service";

const input = { authorName: "David", rating: 1, comment: "Longue attente à la caisse.", locale: "fr" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.branch.findFirst.mockResolvedValue({ id: "branch-1" });
  mocks.branchReview.count.mockResolvedValue(0);
  mocks.branchReview.groupBy.mockResolvedValue([{ rating: 1, _count: { _all: 12 } }]);
  mocks.branchReview.findMany.mockResolvedValue([{
    id: "r1", authorName: "David", rating: 1, comment: input.comment, locale: "fr", createdAt: new Date("2026-10-25T10:00:00Z"),
  }]);
});

describe("Public review service", () => {
  it("includes low ratings, queries only approved reviews, paginates and never selects private fields", async () => {
    const result = await getPublicBranchReviews("ramot", 2);
    expect(result.summary).toMatchObject({ total: 12, averageRating: 1, satisfiedPercent: 0 });
    expect(result.totalPages).toBe(2);
    expect(mocks.branch.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "ramot", isActive: true } }));
    expect(mocks.branchReview.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { branchId: "branch-1", status: "APPROVED" }, skip: 10, take: 10 }));
    const select = mocks.branchReview.findMany.mock.calls[0][0].select;
    expect(select.clientHash).toBeUndefined();
    expect(select.status).toBeUndefined();
    expect(result.reviews[0].createdAt).toBe("2026-10-25T10:00:00.000Z");
  });
  it("does not reveal reviews for inactive or nonexistent branches", async () => {
    mocks.branch.findFirst.mockResolvedValue(null);
    await expect(getPublicBranchReviews("inactive")).rejects.toBeInstanceOf(ReviewBranchNotFoundError);
    expect(mocks.branchReview.findMany).not.toHaveBeenCalled();
  });
  it("stores submissions as pending after taking a database lock", async () => {
    await submitBranchReview("ramot", input, "hashed-client");
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(mocks.branchReview.create).toHaveBeenCalledWith({ data: expect.objectContaining({ rating: 1, status: "PENDING", branchId: "branch-1", clientHash: "hashed-client" }) });
    expect(mocks.query.mock.invocationCallOrder[0]).toBeLessThan(mocks.branchReview.count.mock.invocationCallOrder[0]);
  });
  it("limits submissions across all branches and statuses, including rejected reviews", async () => {
    mocks.branchReview.count.mockResolvedValue(3);
    await expect(submitBranchReview("ramot", input, "hashed-client")).rejects.toBeInstanceOf(ReviewRateLimitError);
    expect(mocks.branchReview.count.mock.calls[0][0].where).not.toHaveProperty("status");
    expect(mocks.branchReview.count.mock.calls[0][0].where).not.toHaveProperty("branchId");
    expect(mocks.branchReview.create).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), updateMany: vi.fn(), audit: vi.fn(), invalidate: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: async (fn: (tx: unknown) => unknown) => fn({
    branchReview: { findUnique: mocks.findUnique, updateMany: mocks.updateMany }, auditLog: { create: mocks.audit },
  }),
} }));
vi.mock("@/lib/admin/cache", () => ({ invalidatePublicBranchCaches: mocks.invalidate }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { moderateReview } from "@/services/admin/review-admin.service";

const actor = { id: "a1", name: "Admin", email: "admin@example.test", role: "ADMIN" as const };
const input = { id: "r1", expectedVersion: 2, status: "APPROVED" };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUnique.mockResolvedValue({ branch: { slug: "ramot" } });
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.audit.mockResolvedValue({});
});

describe("Review moderation transaction", () => {
  it("compares versions, audits the decision and invalidates the affected branch", async () => {
    await moderateReview(input, actor);
    expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: "r1", version: 2 }, data: { status: "APPROVED", version: { increment: 1 } } });
    expect(mocks.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: "a1", entityId: "r1", entityType: "BranchReview", action: "review.approved" }) });
    expect(mocks.invalidate).toHaveBeenCalledWith(["ramot"]);
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/reviews");
  });
  it("refuses a stale moderator and never records an audit or invalidates the cache", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(moderateReview(input, actor)).rejects.toMatchObject({ name: "AdminConflictError" });
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it("does not silently lose the audit if its transaction fails", async () => {
    mocks.audit.mockRejectedValueOnce(new Error("database error"));
    await expect(moderateReview(input, actor)).rejects.toThrow("database error");
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it("refuses unknown review ids", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(moderateReview(input, actor)).rejects.toMatchObject({ name: "AdminNotFoundError" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasPermission } from "@/lib/auth/permissions";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), moderate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/services/admin/review-admin.service", () => ({ moderateReview: mocks.moderate }));
import { moderateReviewAction } from "@/app/admin/(dashboard)/reviews/actions";

beforeEach(() => vi.clearAllMocks());

describe("Review moderation authorization", () => {
  it("refuses anonymous callers before accessing the service", async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await moderateReviewAction({ id: "r1", expectedVersion: 1, status: "APPROVED" });
    expect(result).toMatchObject({ success: false, error: { code: "UNAUTHENTICATED" } });
    expect(mocks.moderate).not.toHaveBeenCalled();
  });
  it("refuses editors even when the action is invoked directly", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "editor", role: "EDITOR" } });
    expect(await moderateReviewAction({ id: "r1", expectedVersion: 1, status: "APPROVED" }))
      .toMatchObject({ success: false, error: { code: "FORBIDDEN" } });
    expect(mocks.moderate).not.toHaveBeenCalled();
    expect(hasPermission("EDITOR", "reviews.moderate")).toBe(false);
  });
  it.each(["ADMIN", "SUPER_ADMIN"])("allows %s to moderate and attributes the action to the session user", async (role) => {
    const actor = { id: "admin-1", role, email: "admin@example.test" };
    mocks.auth.mockResolvedValue({ user: actor });
    const input = { id: "r1", expectedVersion: 4, status: "REJECTED" };
    expect(await moderateReviewAction(input)).toMatchObject({ success: true });
    expect(mocks.moderate).toHaveBeenCalledWith(input, actor);
  });
});

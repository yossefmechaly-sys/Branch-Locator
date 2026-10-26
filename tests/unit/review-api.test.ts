import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  get: vi.fn(), submit: vi.fn(), NotFound: class extends Error {}, RateLimit: class extends Error {},
}));
vi.mock("@/services/review.service", () => ({
  getPublicBranchReviews: mocks.get, submitBranchReview: mocks.submit,
  ReviewBranchNotFoundError: mocks.NotFound, ReviewRateLimitError: mocks.RateLimit,
}));
import { GET, POST } from "@/app/api/branches/[slug]/reviews/route";

const context = { params: Promise.resolve({ slug: "ramot" }) };
const input = { authorName: "David", rating: 1, comment: "Le service pourrait être amélioré.", locale: "fr" };
function request(body: unknown = input, extraHeaders = {}) {
  return new NextRequest("https://example.test/api/branches/ramot/reviews", {
    method: "POST", headers: { origin: "https://example.test", "content-type": "application/json", "x-forwarded-for": "192.0.2.10", ...extraHeaders },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("AUTH_SECRET", "test-only-secret"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test"); });
afterEach(() => vi.unstubAllEnvs());

describe("Public reviews API", () => {
  it("returns pending and hashes the client address before handing it to the service", async () => {
    const response = await POST(request(), context);
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "PENDING" });
    const args = mocks.submit.mock.calls[0];
    expect(args[0]).toBe("ramot");
    expect(args[2]).toMatch(/^[a-f0-9]{64}$/);
    expect(args[2]).not.toContain("192.0.2.10");
  });
  it("rejects cross-origin submissions", async () => {
    expect((await POST(request(input, { origin: "https://evil.test" }), context)).status).toBe(403);
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it.each(["{bad-json", { ...input, status: "APPROVED" }, { ...input, website: "bot.example" }])("rejects invalid submissions %j", async (body) => {
    expect((await POST(request(body), context)).status).toBe(400);
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("bounds actual body size without trusting Content-Length", async () => {
    expect((await POST(request("a".repeat(16_385)), context)).status).toBe(413);
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("returns rate limiting with Retry-After", async () => {
    mocks.submit.mockRejectedValueOnce(new mocks.RateLimit());
    const response = await POST(request(), context);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3600");
  });
  it("returns 404 for inactive or unknown branches", async () => {
    mocks.submit.mockRejectedValueOnce(new mocks.NotFound());
    expect((await POST(request(), context)).status).toBe(404);
  });
  it("validates GET pagination before reading reviews", async () => {
    expect((await GET(new NextRequest("https://example.test/api/branches/ramot/reviews?page=-1"), context)).status).toBe(400);
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it("serves only the public DTO from the service with no shared cache", async () => {
    mocks.get.mockResolvedValueOnce({ reviews: [], summary: { total: 0 } });
    const response = await GET(new NextRequest("https://example.test/api/branches/ramot/reviews?page=2"), context);
    expect(response.status).toBe(200);
    expect(mocks.get).toHaveBeenCalledWith("ramot", 2);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

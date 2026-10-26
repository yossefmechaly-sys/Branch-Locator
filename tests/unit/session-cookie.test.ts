import { describe, expect, it } from "vitest";
import { usesSecureSessionCookie } from "@/lib/auth/session-cookie";

describe("Session cookie naming", () => {
  it("supports local HTTP sessions without changing the production HTTPS behavior", () => {
    expect(usesSecureSessionCookie("http://localhost:3000/admin", null)).toBe(false);
    expect(usesSecureSessionCookie("https://branch-locator.example/admin", null)).toBe(true);
  });
  it("uses the explicitly configured HTTPS auth URL behind a proxy", () => {
    expect(usesSecureSessionCookie("http://localhost:3000/admin", "http", "https://branch-locator.example")).toBe(true);
  });
  it("matches an explicitly configured HTTP development URL", () => {
    expect(usesSecureSessionCookie("http://localhost:3000/admin", null, "http://localhost:3000")).toBe(false);
  });
  it("respects the forwarding protocol when no auth URL is configured", () => {
    expect(usesSecureSessionCookie("http://localhost:3000/admin", "https")).toBe(true);
    expect(usesSecureSessionCookie("http://localhost:3000/admin", "https, http")).toBe(true);
  });
});

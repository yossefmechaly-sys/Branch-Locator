import { describe, expect, it } from "vitest";
import { reviewInputSchema, reviewModerationSchema } from "@/lib/validators/review";
import { summarizeReviews } from "@/lib/reviews/summary";

const input = { authorName: "  Sarah  ", rating: 4, comment: "  Très bon accueil au magasin.  ", locale: "fr" };

describe("Customer review validation", () => {
  it("trims the public name and comment", () => {
    expect(reviewInputSchema.parse(input)).toMatchObject({ authorName: "Sarah", comment: "Très bon accueil au magasin." });
  });
  it.each([0, 6, -1, 2.5, "5", null])("rejects invalid rating %s", (rating) => {
    expect(reviewInputSchema.safeParse({ ...input, rating }).success).toBe(false);
  });
  it.each([
    { status: "APPROVED" }, { branchId: "another-branch" }, { website: "spam.example" },
    { authorName: "  " }, { comment: "court" }, { comment: "a".repeat(2001) }, { locale: "de" },
    { authorName: "😀" }, { comment: "😀".repeat(5) },
  ])("rejects malformed or privileged fields %j", (change) => {
    expect(reviewInputSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
  it("requires a positive concurrency version for moderation", () => {
    expect(reviewModerationSchema.safeParse({ id: "r1", expectedVersion: 0, status: "APPROVED" }).success).toBe(false);
  });
});

describe("Customer satisfaction", () => {
  it("never fabricates a rating or satisfaction percentage for an empty branch", () => {
    expect(summarizeReviews([])).toMatchObject({ total: 0, averageRating: null, satisfiedPercent: null });
  });
  it("weights ratings by review count and counts only 4–5 as satisfied", () => {
    const summary = summarizeReviews([{ rating: 5, count: 1 }, { rating: 4, count: 1 }, { rating: 1, count: 8 }]);
    expect(summary).toMatchObject({ total: 10, averageRating: 1.7, satisfiedPercent: 20 });
    expect(summary.distribution.map((group) => group.count)).toEqual([1, 1, 0, 0, 8]);
  });
});

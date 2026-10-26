import { prisma } from "@/lib/prisma";
import { summarizeReviews } from "@/lib/reviews/summary";
import { REVIEWS_PAGE_SIZE, reviewInputSchema, reviewPageSchema } from "@/lib/validators/review";
import type { PublicReviewsResult, ReviewStatus } from "@/types/review";

export class ReviewBranchNotFoundError extends Error {}
export class ReviewRateLimitError extends Error {}

const PUBLIC_SELECT = {
  id: true, authorName: true, rating: true, comment: true, locale: true, createdAt: true,
} as const;

export async function getPublicBranchReviews(slug: string, requestedPage = 1): Promise<PublicReviewsResult> {
  const page = reviewPageSchema.parse(requestedPage);
  const branch = await prisma.branch.findFirst({ where: { slug, isActive: true }, select: { id: true } });
  if (!branch) throw new ReviewBranchNotFoundError();
  const where = { branchId: branch.id, status: "APPROVED" as const };
  // One snapshot keeps the counts, averages and displayed page consistent.
  return prisma.$transaction(async (tx) => {
    const groups = await tx.branchReview.groupBy({ by: ["rating"], where, orderBy: { rating: "desc" }, _count: { _all: true } });
    const rows = await tx.branchReview.findMany({
      where, select: PUBLIC_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * REVIEWS_PAGE_SIZE, take: REVIEWS_PAGE_SIZE,
    });
    const summary = summarizeReviews(groups.map((group) => ({ rating: group.rating, count: group._count._all })));
    return {
      reviews: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      summary, page, totalPages: Math.ceil(summary.total / REVIEWS_PAGE_SIZE),
    };
  }, { isolationLevel: "RepeatableRead" });
}

export async function submitBranchReview(slug: string, input: unknown, clientHash: string): Promise<void> {
  const parsed = reviewInputSchema.parse(input);
  await prisma.$transaction(async (tx) => {
    const branch = await tx.branch.findFirst({ where: { slug, isActive: true }, select: { id: true } });
    if (!branch) throw new ReviewBranchNotFoundError();
    // Serialize submissions by client across workers; concurrent requests cannot
    // race the count. No raw IP, email address or browser fingerprint is stored.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${clientHash}))`;
    const recent = await tx.branchReview.count({
      where: { clientHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= 3) throw new ReviewRateLimitError();
    await tx.branchReview.create({ data: {
      branchId: branch.id, authorName: parsed.authorName, rating: parsed.rating,
      comment: parsed.comment, locale: parsed.locale, clientHash, status: "PENDING",
    } });
  });
}

export async function listAdminReviews(filters: { branchId?: string; status?: ReviewStatus; page: number }) {
  const where = { branchId: filters.branchId, status: filters.status };
  return prisma.$transaction(async (tx) => {
    const reviews = await tx.branchReview.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * REVIEWS_PAGE_SIZE, take: REVIEWS_PAGE_SIZE,
      select: { ...PUBLIC_SELECT, version: true, status: true,
        branch: { select: { id: true, slug: true, branchCode: true,
          translations: { select: { locale: true, displayName: true } } } } },
    });
    const total = await tx.branchReview.count({ where });
    const pending = await tx.branchReview.count({ where: { branchId: filters.branchId, status: "PENDING" } });
    const groups = await tx.branchReview.groupBy({
      by: ["rating"], where: { branchId: filters.branchId, status: "APPROVED" },
      orderBy: { rating: "desc" }, _count: { _all: true },
    });
    return { reviews, total, pending, totalPages: Math.ceil(total / REVIEWS_PAGE_SIZE),
      summary: summarizeReviews(groups.map((group) => ({ rating: group.rating, count: group._count._all }))) };
  }, { isolationLevel: "RepeatableRead" });
}

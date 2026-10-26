import type { ReviewSummary } from "@/types/review";

export function summarizeReviews(groups: readonly { rating: number; count: number }[]): ReviewSummary {
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: groups.find((group) => group.rating === rating)?.count ?? 0,
  }));
  const total = distribution.reduce((sum, group) => sum + group.count, 0);
  const sum = distribution.reduce((value, group) => value + group.rating * group.count, 0);
  const satisfied = distribution.filter((group) => group.rating >= 4)
    .reduce((value, group) => value + group.count, 0);
  return {
    total,
    averageRating: total ? sum / total : null,
    satisfiedPercent: total ? Math.round(satisfied * 100 / total) : null,
    distribution,
  };
}

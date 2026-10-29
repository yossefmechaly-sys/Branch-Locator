export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface PublicReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  locale: string;
  createdAt: string;
}

export interface ReviewSummary {
  total: number;
  averageRating: number | null;
  /** Percentage of published reviews rated 4 or 5; null when no reviews exist. */
  satisfiedPercent: number | null;
  distribution: { rating: number; count: number }[];
}

/** Public aggregate only: no reviewer details or unpublished reviews. */
export type ReviewRating = Pick<ReviewSummary, "total" | "averageRating">;

export interface PublicReviewsResult {
  reviews: PublicReview[];
  summary: ReviewSummary;
  page: number;
  totalPages: number;
}

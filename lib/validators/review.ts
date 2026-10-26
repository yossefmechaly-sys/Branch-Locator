import { z } from "zod";
import { locales } from "@/types/i18n";
import { REVIEW_STATUSES } from "@/types/review";

export const REVIEW_MAX_BODY_BYTES = 16_384;
export const REVIEWS_PAGE_SIZE = 10;

export const reviewInputSchema = z.object({
  authorName: z.string().trim().min(2).max(80).refine((value) => Array.from(value).length >= 2),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000).refine((value) => Array.from(value).length >= 10),
  locale: z.enum(locales),
  website: z.string().max(0).optional(),
}).strict();

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const reviewPageSchema = z.coerce.number().int().min(1).max(10_000).default(1);

export const reviewModerationSchema = z.object({
  id: z.string().min(1).max(100),
  expectedVersion: z.number().int().positive(),
  status: z.enum(REVIEW_STATUSES),
}).strict();

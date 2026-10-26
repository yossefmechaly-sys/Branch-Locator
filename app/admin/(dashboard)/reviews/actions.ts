"use server";

import { requireMutationPermission } from "@/lib/auth/require";
import { mutationOk, toMutationError } from "@/lib/admin/mutation-result";
import { moderateReview } from "@/services/admin/review-admin.service";

export async function moderateReviewAction(input: unknown) {
  try {
    const actor = await requireMutationPermission("reviews.moderate");
    await moderateReview(input, actor);
    return mutationOk({});
  } catch (error) { return toMutationError(error); }
}

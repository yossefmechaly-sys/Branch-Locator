import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { invalidatePublicBranchCaches } from "@/lib/admin/cache";
import { AdminConflictError, AdminNotFoundError } from "@/lib/admin/mutation-result";
import { reviewModerationSchema } from "@/lib/validators/review";
import type { AdminSessionUser } from "@/types/admin";

export async function moderateReview(input: unknown, actor: AdminSessionUser): Promise<void> {
  const { id, expectedVersion, status } = reviewModerationSchema.parse(input);
  const slug = await prisma.$transaction(async (tx) => {
    const review = await tx.branchReview.findUnique({
      where: { id }, select: { branch: { select: { slug: true } } },
    });
    if (!review) throw new AdminNotFoundError();
    const updated = await tx.branchReview.updateMany({
      where: { id, version: expectedVersion }, data: { status, version: { increment: 1 } },
    });
    if (!updated.count) throw new AdminConflictError();
    await tx.auditLog.create({ data: {
      actorId: actor.id, actorEmail: actor.email, action: `review.${status.toLowerCase()}`,
      entityType: "BranchReview", entityId: id,
    } });
    return review.branch.slug;
  });
  invalidatePublicBranchCaches([slug]);
  revalidatePath("/admin/reviews");
}

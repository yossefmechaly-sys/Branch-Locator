"use server";

import { promotionInputSchema, type PromotionInput } from "@/lib/validators/promotion";
import { requireMutationPermission } from "@/lib/auth/require";
import {
  toMutationError,
  mutationOk,
  type AdminMutationResult,
} from "@/lib/admin/mutation-result";
import { recordAudit } from "@/services/admin/audit.service";
import { promotionStorageProvider } from "@/services/admin/storage/local-storage.provider";
import {
  archivePromotion,
  createPromotion,
  hardDeletePromotion,
  updatePromotion,
} from "@/services/admin/promotion-admin.service";

/**
 * Server Actions Promotions (Phase 9, §11/§19) — pipeline OBLIGATOIRE et
 * IDENTIQUE pour chaque action : authentification + autorisation
 * (`requireMutationPermission`) → Zod (`promotionInputSchema`) → service
 * métier (`services/admin/promotion-admin.service.ts`) → audit. Jamais
 * `prisma` importé ici (§19 : « ne pas mettre Prisma directement dans les
 * Client Components » — et par extension, cette Server Action reste elle
 * aussi une simple orchestration, pas une couche d'accès aux données).
 */

export async function createPromotionAction(
  input: unknown
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: PromotionInput = promotionInputSchema.parse(input);
    const result = await createPromotion(parsed);
    await recordAudit(user, "promotion.create", "Promotion", result.id);
    return mutationOk(result);
  } catch (error) {
    return toMutationError(error);
  }
}

export async function updatePromotionAction(
  id: string,
  // Phase 11, §16ter — voir le commentaire détaillé équivalent dans
  // `branches/actions.ts#updateBranchAction`.
  expectedVersion: number,
  input: unknown
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: PromotionInput = promotionInputSchema.parse(input);
    await updatePromotion(id, expectedVersion, parsed);
    await recordAudit(user, "promotion.update", "Promotion", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function archivePromotionAction(id: string): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("deactivate");
    await archivePromotion(id);
    await recordAudit(user, "promotion.archive", "Promotion", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function hardDeletePromotionAction(id: string): Promise<AdminMutationResult<{ id: string }>> {
  try {
    // §22 : suppression définitive réservée à SUPER_ADMIN — `hardDelete`
    // n'est accordé qu'à ce rôle dans `lib/auth/permissions.ts`, jamais une
    // vérification `role === "SUPER_ADMIN"` recopiée ici.
    const user = await requireMutationPermission("hardDelete");
    await hardDeletePromotion(id);
    await recordAudit(user, "promotion.hardDelete", "Promotion", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

/**
 * Upload sécurisé d'une image de promotion.
 * Le provider valide taille, MIME et signature binaire réelle.
 */
export async function uploadPromotionImageAction(
  formData: FormData
): Promise<AdminMutationResult<{ url: string }>> {
  try {
    await requireMutationPermission("write");

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("Aucun fichier fourni");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const stored = await promotionStorageProvider.save({
      buffer,
      filename: file.name,
      mimeType: file.type,
    });

    return mutationOk({ url: stored.url });
  } catch (error) {
    return toMutationError(error);
  }
}

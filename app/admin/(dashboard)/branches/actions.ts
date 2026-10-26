"use server";

import { branchInputSchema, type BranchInput } from "@/lib/validators/branch";
import { requireMutationPermission } from "@/lib/auth/require";
import { toMutationError, mutationOk, type AdminMutationResult } from "@/lib/admin/mutation-result";
import { recordAudit } from "@/services/admin/audit.service";
import {
  createBranch,
  hardDeleteBranch,
  setBranchActive,
  updateBranch,
} from "@/services/admin/branch-admin.service";
import { geocodeAddress, type GeocodeResult } from "@/services/admin/geocoding.service";
import { localStorageProvider } from "@/services/admin/storage/local-storage.provider";

export async function createBranchAction(input: unknown): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: BranchInput = branchInputSchema.parse(input);
    const result = await createBranch(parsed);
    await recordAudit(user, "branch.create", "Branch", result.id);
    return mutationOk(result);
  } catch (error) {
    return toMutationError(error);
  }
}

export async function updateBranchAction(
  id: string,
  // Phase 11, §16ter (durcissement concurrence optimiste) — jeton opaque
  // `version` (entier), plus une date ISO comparée en chaîne (précision
  // millisecondes/fuseau, aléas de sérialisation) — jamais saisi/affiché par
  // l'utilisateur, transmis tel quel depuis `AdminBranchDetail.version`
  // chargé par le formulaire (voir `BranchForm.tsx`).
  expectedVersion: number,
  input: unknown
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: BranchInput = branchInputSchema.parse(input);
    await updateBranch(id, expectedVersion, parsed);
    await recordAudit(user, "branch.update", "Branch", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function setBranchActiveAction(
  id: string,
  isActive: boolean
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("deactivate");
    await setBranchActive(id, isActive);
    await recordAudit(user, isActive ? "branch.activate" : "branch.deactivate", "Branch", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function hardDeleteBranchAction(id: string): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("hardDelete");
    await hardDeleteBranch(id);
    await recordAudit(user, "branch.hardDelete", "Branch", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

/** §9 : action explicite « Rechercher l'adresse », jamais déclenchée à la
 * frappe — c'est ce bouton, et lui seul, qui appelle le géocodage serveur. */
export async function geocodeAddressAction(address: string): Promise<AdminMutationResult<GeocodeResult>> {
  try {
    await requireMutationPermission("write");
    const result = await geocodeAddress(address);
    return mutationOk(result);
  } catch (error) {
    return toMutationError(error);
  }
}

/** §10 : upload d'image magasin — MIME/taille/contenu validés réellement par
 * `localStorageProvider.save()`, jamais seulement l'extension du fichier. */
export async function uploadBranchImageAction(
  formData: FormData
): Promise<AdminMutationResult<{ url: string }>> {
  try {
    await requireMutationPermission("write");
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("Aucun fichier fourni");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await localStorageProvider.save({
      buffer,
      filename: file.name,
      mimeType: file.type,
    });
    return mutationOk({ url: stored.url });
  } catch (error) {
    return toMutationError(error);
  }
}

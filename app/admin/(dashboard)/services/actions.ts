"use server";

import { serviceInputSchema, type ServiceInput } from "@/lib/validators/service";
import { requireMutationPermission } from "@/lib/auth/require";
import { toMutationError, mutationOk, type AdminMutationResult } from "@/lib/admin/mutation-result";
import { recordAudit } from "@/services/admin/audit.service";
import {
  createService,
  hardDeleteService,
  setServiceActive,
  updateService,
} from "@/services/admin/service-admin.service";

export async function createServiceAction(input: unknown): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: ServiceInput = serviceInputSchema.parse(input);
    const result = await createService(parsed);
    await recordAudit(user, "service.create", "Service", result.id);
    return mutationOk(result);
  } catch (error) {
    return toMutationError(error);
  }
}

export async function updateServiceAction(
  id: string,
  // Phase 11, §16ter — voir le commentaire détaillé équivalent dans
  // `branches/actions.ts#updateBranchAction`.
  expectedVersion: number,
  input: unknown
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: ServiceInput = serviceInputSchema.parse(input);
    await updateService(id, expectedVersion, parsed);
    await recordAudit(user, "service.update", "Service", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function setServiceActiveAction(
  id: string,
  isActive: boolean
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("deactivate");
    await setServiceActive(id, isActive);
    await recordAudit(user, isActive ? "service.activate" : "service.deactivate", "Service", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function hardDeleteServiceAction(id: string): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("hardDelete");
    await hardDeleteService(id);
    await recordAudit(user, "service.hardDelete", "Service", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

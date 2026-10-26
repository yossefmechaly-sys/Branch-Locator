"use server";

import { cityInputSchema, type CityInput } from "@/lib/validators/city";
import { requireMutationPermission } from "@/lib/auth/require";
import { toMutationError, mutationOk, type AdminMutationResult } from "@/lib/admin/mutation-result";
import { recordAudit } from "@/services/admin/audit.service";
import { createCity, hardDeleteCity, setCityActive, updateCity } from "@/services/admin/city-admin.service";

export async function createCityAction(input: unknown): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: CityInput = cityInputSchema.parse(input);
    const result = await createCity(parsed);
    await recordAudit(user, "city.create", "City", result.id);
    return mutationOk(result);
  } catch (error) {
    return toMutationError(error);
  }
}

export async function updateCityAction(
  id: string,
  // Phase 11, §16ter — voir le commentaire détaillé équivalent dans
  // `branches/actions.ts#updateBranchAction`.
  expectedVersion: number,
  input: unknown
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("write");
    const parsed: CityInput = cityInputSchema.parse(input);
    await updateCity(id, expectedVersion, parsed);
    await recordAudit(user, "city.update", "City", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function setCityActiveAction(
  id: string,
  isActive: boolean
): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("deactivate");
    await setCityActive(id, isActive);
    await recordAudit(user, isActive ? "city.activate" : "city.deactivate", "City", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

export async function hardDeleteCityAction(id: string): Promise<AdminMutationResult<{ id: string }>> {
  try {
    const user = await requireMutationPermission("hardDelete");
    await hardDeleteCity(id);
    await recordAudit(user, "city.hardDelete", "City", id);
    return mutationOk({ id });
  } catch (error) {
    return toMutationError(error);
  }
}

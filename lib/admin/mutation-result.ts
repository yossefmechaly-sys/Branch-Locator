import { ZodError } from "zod";

import { AdminAuthorizationError, AdminUnauthenticatedError } from "@/lib/auth/require";
import { InvalidUploadError } from "@/services/admin/storage/storage-provider";
import { GeocodingError } from "@/services/admin/geocoding.service";
import { ImportFileError, ImportSessionExpiredError } from "@/lib/import/errors";

/**
 * Résultat normalisé de TOUTE Server Action de mutation admin (Phase 9,
 * §19 : « les erreurs doivent être normalisées »). Chaque Server Action de
 * `app/admin/**` retourne CE type, jamais une exception qui remonterait brute
 * jusqu'au composant client (message technique illisible, ou pire, une page
 * d'erreur Next.js générique remplaçant tout le formulaire déjà rempli).
 */
export type AdminMutationError =
  | { code: "UNAUTHENTICATED"; message: string }
  | { code: "FORBIDDEN"; message: string }
  | { code: "VALIDATION"; message: string; fieldErrors: Record<string, string[]> }
  | { code: "CONFLICT"; message: string }
  | { code: "NOT_FOUND"; message: string }
  | { code: "RELATION_IN_USE"; message: string }
  | { code: "UNKNOWN"; message: string };

export type AdminMutationResult<T> =
  | { success: true; data: T }
  | { success: false; error: AdminMutationError };

export function mutationOk<T>(data: T): AdminMutationResult<T> {
  return { success: true, data };
}

export function mutationError<T>(error: AdminMutationError): AdminMutationResult<T> {
  return { success: false, error };
}

/** Levée par la couche service quand `updatedAt` ne correspond plus à la
 * version chargée par le formulaire (Phase 9, §17 — concurrence d'édition). */
export class AdminConflictError extends Error {
  constructor(message = "Cet enregistrement a été modifié entre-temps") {
    super(message);
    this.name = "AdminConflictError";
  }
}

/** Levée par la couche service quand l'entité ciblée n'existe plus. */
export class AdminNotFoundError extends Error {
  constructor(message = "Enregistrement introuvable") {
    super(message);
    this.name = "AdminNotFoundError";
  }
}

/** Levée quand une suppression définitive est refusée à cause de relations
 * existantes (Phase 9, §22 : « contrôle des relations… aucun cascade
 * destructif silencieux ») — ex. une ville encore référencée par des
 * magasins, un service encore lié à des magasins. */
export class AdminRelationInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminRelationInUseError";
  }
}

/**
 * Traduit n'importe quelle erreur levée pendant le pipeline
 * auth → autorisation → Zod → service → repository en un
 * `AdminMutationResult` normalisé — le SEUL endroit qui fait cette
 * traduction, appelé par le `catch` de chaque Server Action (§19).
 */
export function toMutationError<T>(error: unknown): AdminMutationResult<T> {
  if (error instanceof AdminUnauthenticatedError) {
    return mutationError({ code: "UNAUTHENTICATED", message: error.message });
  }
  if (error instanceof AdminAuthorizationError) {
    return mutationError({ code: "FORBIDDEN", message: error.message });
  }
  if (error instanceof AdminConflictError) {
    return mutationError({ code: "CONFLICT", message: error.message });
  }
  if (error instanceof AdminNotFoundError) {
    return mutationError({ code: "NOT_FOUND", message: error.message });
  }
  if (error instanceof AdminRelationInUseError) {
    return mutationError({ code: "RELATION_IN_USE", message: error.message });
  }
  if (error instanceof InvalidUploadError) {
    return mutationError({ code: "VALIDATION", message: error.message, fieldErrors: { file: [error.message] } });
  }
  if (error instanceof GeocodingError) {
    return mutationError({ code: "VALIDATION", message: error.message, fieldErrors: { address: [error.message] } });
  }
  if (error instanceof ImportFileError) {
    return mutationError({ code: "VALIDATION", message: error.message, fieldErrors: { file: [error.message] } });
  }
  if (error instanceof ImportSessionExpiredError) {
    return mutationError({ code: "CONFLICT", message: error.message });
  }
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_root";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return mutationError({
      code: "VALIDATION",
      message: "Données invalides",
      fieldErrors,
    });
  }

  console.error("[admin mutation] erreur non normalisée :", error);
  return mutationError({
    code: "UNKNOWN",
    message: "Une erreur inattendue est survenue",
  });
}

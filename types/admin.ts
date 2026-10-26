/**
 * Types du back-office (Phase 9) — rôles et session admin. Séparé de
 * `types/i18n.ts`/`types/branch.ts` : ce fichier ne concerne QUE
 * l'authentification/autorisation de `/admin`, jamais le domaine public.
 *
 * `AdminRole` reflète EXACTEMENT l'enum Prisma `AdminRole`
 * (`prisma/schema.prisma`) — trois valeurs, aucune notion de hiérarchie
 * implicite dans le type lui-même (la hiérarchie de permissions vit
 * uniquement dans `lib/auth/permissions.ts`, §1 : « centralise les
 * permissions dans une couche dédiée »).
 */
export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR";

export const ADMIN_ROLES: readonly AdminRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

/** Utilisateur admin authentifié tel qu'exposé par la session (Auth.js) —
 * jamais `passwordHash`, qui ne doit JAMAIS quitter la couche repository. */
export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

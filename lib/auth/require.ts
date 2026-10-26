import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { AdminSessionUser } from "@/types/admin";

import { hasPermission, type AdminAction } from "./permissions";

/**
 * Gardes serveur (Phase 9, §1/§19/§24) — LE point de passage obligé de toute
 * page, layout ou Server Action admin. Le `proxy.ts` ne fait qu'une
 * redirection de confort côté navigation ; ces fonctions sont la garantie
 * RÉELLE (§1 : « contrôlées côté serveur, pas seulement par masquage UI »)
 * — un appel direct à une Server Action, un test qui contourne le proxy, ou
 * un futur refactor de route qui oublierait le proxy retombent tous sur ce
 * même filet.
 */

/** Erreur normalisée levée par une Server Action quand la permission est
 * refusée — jamais une redirection depuis une action de mutation (§19 :
 * « afficher succès et erreurs », pas une navigation surprise après un clic
 * sur « Enregistrer »). Distincte de `redirect()` utilisé par les PAGES. */
export class AdminAuthorizationError extends Error {
  constructor(action: AdminAction) {
    super(`Action refusée pour ce rôle : "${action}"`);
    this.name = "AdminAuthorizationError";
  }
}

/**
 * Pour les PAGES/layouts (Server Components) : redirige vers `/admin/login`
 * si aucune session valide. Le proxy fait déjà ce travail pour la navigation
 * normale, mais une page reste protégée même si elle est atteinte par un
 * chemin qui contournerait le proxy (rendu direct en test, changement futur
 * de `matcher`) — défense en profondeur, jamais une confiance aveugle en une
 * seule couche (§1/§24).
 */
export async function requireAdminSession(): Promise<{ user: AdminSessionUser }> {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }
  return { user: session.user };
}

/** Variante page : session + permission, redirige (jamais de page blanche)
 * si le rôle n'a pas la permission demandée. */
export async function requireAdminPermission(action: AdminAction): Promise<{ user: AdminSessionUser }> {
  const { user } = await requireAdminSession();
  if (!hasPermission(user.role, action)) {
    redirect("/admin?erreur=permission");
  }
  return { user };
}

/**
 * Pour les SERVER ACTIONS (mutations, §19) : ne redirige JAMAIS (une
 * redirection au milieu d'une soumission de formulaire casserait le retour
 * `{success,error}` attendu par le client) — lève `AdminAuthorizationError`,
 * capturée par l'action appelante et normalisée (`lib/admin/errors.ts`).
 * Retourne aussi `null` explicitement si aucune session (plutôt que de
 * confondre avec une permission refusée) pour que l'appelant distingue
 * « session expirée » de « rôle insuffisant » dans le message renvoyé au
 * client.
 */
export async function requireMutationPermission(
  action: AdminAction
): Promise<AdminSessionUser> {
  const session = await auth();
  if (!session?.user) {
    throw new AdminUnauthenticatedError();
  }
  if (!hasPermission(session.user.role, action)) {
    throw new AdminAuthorizationError(action);
  }
  return session.user;
}

export class AdminUnauthenticatedError extends Error {
  constructor() {
    super("Session invalide ou expirée");
    this.name = "AdminUnauthenticatedError";
  }
}

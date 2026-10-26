"use server";

import { signOut } from "@/lib/auth";

/** Déconnexion (Phase 9, §1/§24) — invalide le JWT de session et redirige
 * vers `/admin/login`. Server Action distincte du reste des mutations
 * métier (`services/admin/*`) : pas de permission requise pour se
 * déconnecter, seule une session (même expirée côté client) suffit à
 * déclencher l'action. */
export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

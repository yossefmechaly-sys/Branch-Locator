import type { AdminRole } from "@/types/admin";

/**
 * Couche centrale de permissions (Phase 9, §1) — LA SEULE source de vérité
 * pour « qui a le droit de faire quoi » dans le back-office. Toute page,
 * layout, Server Action ou route `/api/admin/**` doit passer par
 * `hasPermission()`/`requirePermission()` (`lib/auth/require.ts`) — jamais
 * une vérification de rôle recopiée localement (`if (role === "ADMIN")`
 * dispersé dans le code), qui finirait inévitablement par diverger.
 *
 * Matrice volontairement UNIFORME entre les quatre ressources gérées cette
 * phase (magasins/promotions/services/villes) — rien dans le cahier des
 * charges ne justifie une matrice différente par ressource, donc une seule
 * table `ROLE_ACTIONS`, plus simple à auditer qu'une combinatoire
 * ressource × action × rôle.
 *
 * - `view`       : consulter les listes/fiches admin (les trois rôles).
 * - `write`      : créer/modifier (les trois rôles — un EDITOR doit pouvoir
 *                  éditer une traduction ou un horaire, §7/§16 du cahier des
 *                  charges implique cette capacité, jamais réservée aux
 *                  rôles supérieurs).
 * - `deactivate` : bascule actif/inactif — soft-delete préféré (§22),
 *                  refusé à EDITOR (§24 : « suppression refusée EDITOR »).
 * - `hardDelete` : suppression DÉFINITIVE — SUPER_ADMIN uniquement (§22).
 *
 * Phase 10, §35 ajoute cinq actions pour analytics/import/export, PAS dans la
 * matrice « uniforme » ci-dessus (analytics/import/export ne sont pas une
 * cinquième ressource CRUD comme magasins/promotions/services/villes, donc
 * pas de raison qu'elles suivent exactement `view`/`write`/`deactivate`) :
 * - `analytics.read`   : consulter `/admin/analytics` — les TROIS rôles
 *                        (§35, littéral : « EDITOR peut avoir lecture
 *                        analytics »).
 * - `analytics.export` : exporter le rapport analytics filtré (CSV/XLSX,
 *                        §32) — ADMIN/SUPER_ADMIN uniquement (un export est
 *                        un artefact qui QUITTE l'admin, traité comme une
 *                        action à plus fort impact que la simple lecture à
 *                        l'écran, cohérent avec `deactivate` déjà réservé
 *                        au-dessus d'EDITOR).
 * - `import.preview`   : dry-run d'import (§25) — ADMIN/SUPER_ADMIN. Un
 *                        dry-run n'écrit rien en base, mais reste réservé
 *                        (pas de raison de l'ouvrir à EDITOR alors que
 *                        l'import réel lui est fermé — §35 : « pas d'import
 *                        destructif [pour EDITOR] sauf décision documentée »,
 *                        et aucune décision de ce type n'est prise ici).
 * - `import.execute`   : import réel (écriture en base, §28) — ADMIN/
 *                        SUPER_ADMIN. Volontairement PAS réservé au seul
 *                        SUPER_ADMIN : un import de masse modifie des
 *                        magasins existants un peu comme `write`, jamais une
 *                        suppression irréversible comme `hardDelete`; un
 *                        ADMIN peut déjà tout faire sur les magasins un par
 *                        un (§35 : « SUPER_ADMIN/ADMIN selon stratégie
 *                        existante »).
 * - `export.data`      : export magasins/promotions (§31/§33) — ADMIN/
 *                        SUPER_ADMIN, même raisonnement que
 *                        `analytics.export`.
 */
export type AdminAction =
  | "view"
  | "write"
  | "deactivate"
  | "hardDelete"
  | "analytics.read"
  | "analytics.export"
  | "import.preview"
  | "import.execute"
  | "export.data"
  | "reviews.moderate";

const ROLE_ACTIONS: Record<AdminRole, ReadonlySet<AdminAction>> = {
  EDITOR: new Set<AdminAction>(["view", "write", "analytics.read"]),
  ADMIN: new Set<AdminAction>([
    "reviews.moderate",
    "view",
    "write",
    "deactivate",
    "analytics.read",
    "analytics.export",
    "import.preview",
    "import.execute",
    "export.data",
  ]),
  SUPER_ADMIN: new Set<AdminAction>([
    "reviews.moderate",
    "view",
    "write",
    "deactivate",
    "hardDelete",
    "analytics.read",
    "analytics.export",
    "import.preview",
    "import.execute",
    "export.data",
  ]),
};

export function hasPermission(role: AdminRole, action: AdminAction): boolean {
  return ROLE_ACTIONS[role]?.has(action) ?? false;
}

/** Libellé affiché dans l'admin (bandeau de rôle, tooltips de bouton
 * désactivé) — jamais recodé ailleurs qu'ici. */
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
};

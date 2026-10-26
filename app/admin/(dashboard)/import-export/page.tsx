import type { Metadata } from "next";

import { BranchImportWizard } from "@/components/admin/import/BranchImportWizard";
import { ExportPanel } from "@/components/admin/import/ExportPanel";
import { hasPermission } from "@/lib/auth/permissions";
import { requireAdminPermission } from "@/lib/auth/require";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";

export const metadata: Metadata = { title: "Branch Locator Admin" };

/**
 * Import / Export magasins (Phase 10, Partie D — §21-§29). Export (Partie E)
 * arrive séparément (§115). `import.preview` suffit pour VOIR cette page
 * (lecture seule, un EDITOR pourrait un jour y avoir accès en lecture s'il
 * obtenait cette permission — actuellement réservée ADMIN/SUPER_ADMIN, §35) ;
 * `import.execute` conditionne uniquement le bouton de confirmation, vérifié
 * à nouveau côté serveur par `executeBranchImportAction` (§1 Phase 9 :
 * jamais un contrôle uniquement côté UI).
 */
export default async function AdminImportExportPage() {
  const [{ user }, locale] = await Promise.all([
    requireAdminPermission("import.preview"),
    getAdminLocale(),
  ]);

  const t = getAdminDictionary(locale).importExport;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      <BranchImportWizard canExecute={hasPermission(user.role, "import.execute")} />

      {hasPermission(user.role, "export.data") && <ExportPanel />}
    </div>
  );
}

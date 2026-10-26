"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { triggerFileDownload } from "@/lib/admin/download";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { translateAdminErrorMessage } from "@/lib/admin-i18n/errors";

import { exportBranchesAction, exportPromotionsAction } from "@/app/admin/(dashboard)/import-export/actions";

/**
 * Export magasins/promotions (Phase 10, §31/§33) — l'export magasins produit
 * un fichier directement réimportable (mêmes colonnes que le template
 * d'import, voir `lib/export/branch-export.ts`).
 */
export function ExportPanel() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.importExport;

  function handleExport(kind: "branches" | "promotions", format: "csv" | "xlsx") {
    setError(null);
    startTransition(async () => {
      const response = kind === "branches" ? await exportBranchesAction(format) : await exportPromotionsAction(format);
      if (!response.success) {
        setError(translateAdminErrorMessage(response.error.message, locale));
        return;
      }
      triggerFileDownload(response.data);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.exportTitle}</CardTitle>
        <CardDescription>{t.exportDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-sm text-muted-foreground">{t.branches}</span>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("branches", "csv")}>
            CSV
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("branches", "xlsx")}>
            XLSX
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-sm text-muted-foreground">{t.promotions}</span>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("promotions", "csv")}>
            CSV
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("promotions", "xlsx")}>
            XLSX
          </Button>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

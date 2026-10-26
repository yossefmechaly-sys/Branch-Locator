"use client";

import { useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { triggerFileDownload } from "@/lib/admin/download";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { translateAdminErrorMessage } from "@/lib/admin-i18n/errors";
import type { ImportAnalysis, ImportRowResult } from "@/lib/import/branch-import";

import {
  downloadBranchImportTemplateAction,
  executeBranchImportAction,
  previewBranchImportAction,
  type ImportExecuteResponse,
} from "@/app/admin/(dashboard)/import-export/actions";

/**
 * Assistant d'import magasins (Phase 10, §24) — Upload → Parsing →
 * Validation → Preview → Confirmation → Import, EN UN SEUL composant client
 * qui n'exécute AUCUNE logique métier lui-même : chaque étape appelle une
 * Server Action dédiée (`app/admin/(dashboard)/import-export/actions.ts`),
 * jamais Prisma ni la validation directement ici (§19 Phase 9, toujours en
 * vigueur).
 */

const ACTION_VARIANTS: Record<
  ImportRowResult["action"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  create: "default",
  update: "secondary",
  error: "destructive",
  ignored: "outline",
};

export function BranchImportWizard({ canExecute }: { canExecute: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ importId: string; fileName: string; analysis: ImportAnalysis } | null>(null);
  const [result, setResult] = useState<ImportExecuteResponse | null>(null);
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.importExport;

  const actionLabels: Record<ImportRowResult["action"], string> = {
    create: t.actionCreate,
    update: t.actionUpdate,
    error: t.actionError,
    ignored: t.actionIgnored,
  };

  function handleDownloadTemplate() {
    startTransition(async () => {
      const response = await downloadBranchImportTemplateAction();
      if (!response.success) {
        setError(translateAdminErrorMessage(response.error.message, locale));
        return;
      }
      triggerFileDownload({
        fileName: "magasins-template.csv",
        mimeType: "text/csv;charset=utf-8",
        content: response.data.csv,
        encoding: "utf-8",
      });
    });
  }

  function handleAnalyze() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError(t.selectFileFirst);
      return;
    }
    setError(null);
    setResult(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const response = await previewBranchImportAction(formData);
      if (!response.success) {
        setError(translateAdminErrorMessage(response.error.message, locale));
        setPreview(null);
        return;
      }
      setPreview(response.data);
    });
  }

  function handleConfirm() {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      const response = await executeBranchImportAction(preview.importId);
      if (!response.success) {
        setError(translateAdminErrorMessage(response.error.message, locale));
        return;
      }
      setResult(response.data);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handleReset() {
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const summary = preview?.analysis.summary;
  const canConfirm = canExecute && !!summary && summary.toCreate + summary.toUpdate > 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.importBranches}</CardTitle>
          <CardDescription>{t.importDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={isPending}>
              {t.downloadTemplate}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="h-9 max-w-sm rounded-md border border-input bg-transparent px-3 py-1.5 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              disabled={isPending}
            />
            <Button type="button" size="sm" onClick={handleAnalyze} disabled={isPending}>
              {isPending && !preview ? t.analyzing : t.analyzePreview}
            </Button>
            {(preview || result) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} disabled={isPending}>
                {t.restart}
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-success">
          <CardHeader>
            <CardTitle>{t.importCompleted}</CardTitle>
            <CardDescription>
              {result.created} {t.createdBranches}, {result.updated} {t.updatedBranches}.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {preview && summary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {t.preview} — <span dir="ltr">« {preview.fileName} »</span>
              </CardTitle>
              <CardDescription>{t.dryRun}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <SummaryStat label={t.rows} value={summary.total} />
                <SummaryStat label={t.newRows} value={summary.toCreate} tone="positive" />
                <SummaryStat label={t.modifications} value={summary.toUpdate} />
                <SummaryStat label={t.errors} value={summary.errors} tone="negative" />
                <SummaryStat label={t.ignored} value={summary.ignored} />
              </div>
              {summary.withWarnings > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {summary.withWarnings} {t.warningsSummary}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <Button type="button" onClick={handleConfirm} disabled={!canConfirm || isPending}>
                  {isPending
                    ? t.importing
                    : `${t.confirmImport} (${summary.toCreate + summary.toUpdate})`}
                </Button>
                {!canExecute && (
                  <span className="text-xs text-muted-foreground">
                    {t.readOnlyRole}
                  </span>
                )}
                {canExecute && summary.toCreate + summary.toUpdate === 0 && (
                  <span className="text-xs text-muted-foreground">{t.noValidRows}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.rowDetails}</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/40">
                  <tr>
                    <th className="p-3 text-start font-medium">{t.row}</th>
                    <th className="p-3 text-start font-medium">{t.status}</th>
                    <th className="p-3 text-start font-medium">{t.branchCode}</th>
                    <th className="p-3 text-start font-medium">{t.slug}</th>
                    <th className="p-3 text-start font-medium">{t.name}</th>
                    <th className="p-3 text-start font-medium">{t.details}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.analysis.rows.map((row) => (
                    <tr key={row.rowNumber} className="border-b last:border-0 align-top">
                      <td className="p-3 text-muted-foreground">{row.rowNumber}</td>
                      <td className="p-3">
                        <Badge variant={ACTION_VARIANTS[row.action]}>{actionLabels[row.action]}</Badge>
                      </td>
                      <td className="p-3" dir="ltr">{row.branchCode || "—"}</td>
                      <td className="p-3" dir="ltr">{row.slug || "—"}</td>
                      <td className="p-3">{row.displayName || "—"}</td>
                      <td className="p-3">
                        {row.errors.length > 0 && (
                          <ul className="list-inside list-disc text-destructive">
                            {row.errors.map((message, i) => (
                              <li key={i}>{translateAdminErrorMessage(message, locale)}</li>
                            ))}
                          </ul>
                        )}
                        {row.warnings.length > 0 && (
                          <ul className="list-inside list-disc text-muted-foreground">
                            {row.warnings.map((message, i) => (
                              <li key={i}>{translateAdminErrorMessage(message, locale)}</li>
                            ))}
                          </ul>
                        )}
                        {row.errors.length === 0 && row.warnings.length === 0 && row.action !== "ignored" && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "positive" | "negative" }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "positive"
            ? "text-2xl font-semibold text-success"
            : tone === "negative"
              ? "text-2xl font-semibold text-destructive"
              : "text-2xl font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}

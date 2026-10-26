"use server";

import {
  BRANCH_IMPORT_COLUMNS,
  IMPORT_ALLOWED_EXTENSIONS,
  IMPORT_ALLOWED_MIME_TYPES,
  IMPORT_MAX_FILE_BYTES,
  buildBranchImportTemplateCsv,
  parseImportFile,
  type ImportAnalysis,
} from "@/lib/import/branch-import";
import { ImportFileError, ImportSessionExpiredError } from "@/lib/import/errors";
import { createPendingImport, takePendingImport } from "@/lib/import/pending-imports";
import { requireMutationPermission } from "@/lib/auth/require";
import { toMutationError, mutationOk, type AdminMutationResult } from "@/lib/admin/mutation-result";
import { executeBranchImport, previewBranchImport } from "@/services/admin/import.service";
import {
  exportBranchesCsv,
  exportBranchesXlsx,
  exportPromotionsCsv,
  exportPromotionsXlsx,
} from "@/services/admin/export.service";

/**
 * Server Actions Import (Phase 10, §21/§24) — pipeline complet
 * authentification → autorisation → validation upload → parsing → moteur de
 * validation → (aperçu) OU (transaction réelle), jamais de logique métier
 * dans le composant client (§19 Phase 9, toujours en vigueur).
 */

function assertUploadIsSafe(file: File): void {
  const lower = file.name.toLowerCase();
  const hasAllowedExtension = IMPORT_ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!hasAllowedExtension) {
    throw new ImportFileError(`Extension non autorisée — utilisez un fichier ${IMPORT_ALLOWED_EXTENSIONS.join(" ou ")}`);
  }
  // §36 : le MIME déclaré par le navigateur n'est qu'un indice (facilement
  // faux), JAMAIS la seule vérification — l'extension ci-dessus ET le
  // parsing réel (`parseImportFile`, qui rejette un contenu illisible) sont
  // les contrôles qui comptent vraiment ; ce test élimine seulement les cas
  // grossiers (ex. un .jpg renommé en .csv avec un MIME image/jpeg encore
  // présent).
  if (file.type && !IMPORT_ALLOWED_MIME_TYPES.includes(file.type as (typeof IMPORT_ALLOWED_MIME_TYPES)[number])) {
    throw new ImportFileError(`Type de fichier non reconnu ("${file.type}") — utilisez un fichier CSV ou XLSX`);
  }
  if (file.size > IMPORT_MAX_FILE_BYTES) {
    throw new ImportFileError(
      `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo, maximum ${(IMPORT_MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} Mo)`
    );
  }
  if (file.size === 0) {
    throw new ImportFileError("Fichier vide");
  }
}

export interface ImportPreviewResponse {
  importId: string;
  fileName: string;
  analysis: ImportAnalysis;
}

/** Étape « Upload → Parsing → Validation → Preview » (§24) — mode dry-run
 * réel : identique aux validations de l'import final, aucune écriture (§25). */
export async function previewBranchImportAction(formData: FormData): Promise<AdminMutationResult<ImportPreviewResponse>> {
  try {
    const user = await requireMutationPermission("import.preview");

    const file = formData.get("file");
    if (!(file instanceof File)) throw new ImportFileError("Aucun fichier fourni");
    assertUploadIsSafe(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseImportFile(buffer, file.name);
    if (!parsed.ok) throw new ImportFileError(parsed.error);

    const analysis = await previewBranchImport(parsed.file.rawRows, parsed.file.headerKeys);

    const importId = createPendingImport({
      rawRows: parsed.file.rawRows,
      headerKeys: parsed.file.headerKeys,
      fileName: file.name,
      entityType: "branch",
      createdBy: user.id,
    });

    return mutationOk({ importId, fileName: file.name, analysis });
  } catch (error) {
    return toMutationError(error);
  }
}

export interface ImportExecuteResponse {
  analysis: ImportAnalysis;
  created: number;
  updated: number;
}

/** Étape « Confirmation → Import » (§24) — revalide les MÊMES lignes
 * (`importId`, à usage unique) contre l'état ACTUEL de la base, puis écrit
 * les lignes valides dans une transaction contrôlée (§28). */
export async function executeBranchImportAction(importId: string): Promise<AdminMutationResult<ImportExecuteResponse>> {
  try {
    const user = await requireMutationPermission("import.execute");

    const pending = takePendingImport(importId);
    if (!pending) throw new ImportSessionExpiredError();

    const result = await executeBranchImport(pending.rawRows, pending.headerKeys, user.id, user.email);

    return mutationOk({ analysis: result.analysis, created: result.created, updated: result.updated });
  } catch (error) {
    return toMutationError(error);
  }
}

/** Template CSV officiel (§23) — même colonnes que le moteur de validation
 * (`BRANCH_IMPORT_COLUMNS`), jamais un exemple divergent maintenu à la main. */
export async function downloadBranchImportTemplateAction(): Promise<AdminMutationResult<{ csv: string; columns: string[] }>> {
  try {
    await requireMutationPermission("import.preview");
    return mutationOk({ csv: buildBranchImportTemplateCsv(), columns: [...BRANCH_IMPORT_COLUMNS] });
  } catch (error) {
    return toMutationError(error);
  }
}

export interface FileDownloadResponse {
  fileName: string;
  mimeType: string;
  /** CSV : texte UTF-8 directement. XLSX : Buffer encodé en base64 (une
   * Server Action ne peut pas renvoyer un `Buffer` binaire brut au client de
   * façon fiable à travers la frontière RSC). */
  content: string;
  encoding: "utf-8" | "base64";
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Export magasins (§31) — mêmes colonnes/mêmes identifiants que
 * `BRANCH_IMPORT_COLUMNS`, un fichier exporté est directement réimportable. */
export async function exportBranchesAction(format: "csv" | "xlsx"): Promise<AdminMutationResult<FileDownloadResponse>> {
  try {
    await requireMutationPermission("export.data");
    if (format === "csv") {
      return mutationOk({
        fileName: "magasins.csv",
        mimeType: "text/csv;charset=utf-8",
        content: await exportBranchesCsv(),
        encoding: "utf-8",
      });
    }
    const buffer = await exportBranchesXlsx();
    return mutationOk({ fileName: "magasins.xlsx", mimeType: XLSX_MIME, content: buffer.toString("base64"), encoding: "base64" });
  } catch (error) {
    return toMutationError(error);
  }
}

/** Export promotions (§33). */
export async function exportPromotionsAction(format: "csv" | "xlsx"): Promise<AdminMutationResult<FileDownloadResponse>> {
  try {
    await requireMutationPermission("export.data");
    if (format === "csv") {
      return mutationOk({
        fileName: "promotions.csv",
        mimeType: "text/csv;charset=utf-8",
        content: await exportPromotionsCsv(),
        encoding: "utf-8",
      });
    }
    const buffer = await exportPromotionsXlsx();
    return mutationOk({ fileName: "promotions.xlsx", mimeType: XLSX_MIME, content: buffer.toString("base64"), encoding: "base64" });
  } catch (error) {
    return toMutationError(error);
  }
}

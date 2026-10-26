"use server";

import { requireMutationPermission } from "@/lib/auth/require";
import { toMutationError, mutationOk, type AdminMutationResult } from "@/lib/admin/mutation-result";
import { getAnalyticsDashboard } from "@/services/admin/analytics.service";
import { exportAnalyticsCsv, exportAnalyticsXlsx } from "@/services/admin/export.service";
import type { AnalyticsFilters } from "@/types/analytics";

import type { FileDownloadResponse } from "../import-export/actions";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Export du rapport analytics FILTRÉ (Phase 10, §32) — recalcule le tableau
 * de bord avec EXACTEMENT les mêmes `filters` que ceux affichés à l'écran
 * (reçus du client, jamais recalculés différemment) via
 * `getAnalyticsDashboard()`, la même fonction que la page elle-même — pas de
 * second moteur d'agrégation pour l'export.
 */
export async function exportAnalyticsAction(
  filters: AnalyticsFilters,
  format: "csv" | "xlsx"
): Promise<AdminMutationResult<FileDownloadResponse>> {
  try {
    await requireMutationPermission("analytics.export");
    const dashboard = await getAnalyticsDashboard(filters);

    if (format === "csv") {
      return mutationOk({
        fileName: `analytics_${filters.startDate}_${filters.endDate}.csv`,
        mimeType: "text/csv;charset=utf-8",
        content: exportAnalyticsCsv(dashboard),
        encoding: "utf-8",
      });
    }
    const buffer = await exportAnalyticsXlsx(dashboard);
    return mutationOk({
      fileName: `analytics_${filters.startDate}_${filters.endDate}.xlsx`,
      mimeType: XLSX_MIME,
      content: buffer.toString("base64"),
      encoding: "base64",
    });
  } catch (error) {
    return toMutationError(error);
  }
}

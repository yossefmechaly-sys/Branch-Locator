"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { triggerFileDownload } from "@/lib/admin/download";
import type { AnalyticsFilters } from "@/types/analytics";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { translateAdminErrorMessage } from "@/lib/admin-i18n/errors";

import { exportAnalyticsAction } from "@/app/admin/(dashboard)/analytics/actions";

/** Export du rapport analytics filtré (Phase 10, §32) — exporte EXACTEMENT
 * les filtres actuellement affichés à l'écran. */
export function AnalyticsExportButtons({ filters }: { filters: AnalyticsFilters }) {
  const [isPending, startTransition] = useTransition();
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.analytics;
  const [error, setError] = useState<string | null>(null);

  function handleExport(format: "csv" | "xlsx") {
    setError(null);
    startTransition(async () => {
      const response = await exportAnalyticsAction(filters, format);
      if (!response.success) {
        setError(translateAdminErrorMessage(response.error.message, locale));
        return;
      }
      triggerFileDownload(response.data);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("csv")}>
        {t.exportCsv}
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("xlsx")}>
        {t.exportXlsx}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

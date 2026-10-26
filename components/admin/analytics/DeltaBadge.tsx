"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { cn } from "@/lib/utils";

import { formatDeltaPercent } from "./format";

export function DeltaBadge({ value }: { value: number | null }) {
  const { locale, dictionary } = useAdminI18n();
  const { text, tone } = formatDeltaPercent(value, locale);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
        tone === "positive" && "bg-success/15 text-success",
        tone === "negative" && "bg-destructive/15 text-destructive",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
      title={dictionary.analytics.previousPeriodVariation}
    >
      {text}
    </span>
  );
}

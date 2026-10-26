"use client";

import { locales } from "@/types/i18n";
import type { TranslationStatus } from "@/lib/admin/translation-status";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export function TranslationStatusBadges({
  status,
}: {
  status: TranslationStatus;
}) {
  const { dictionary } = useAdminI18n();
  const t = dictionary.translationStatus;

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs" dir="ltr">
      {locales.map((locale) => (
        <span
          key={locale}
          className={cn(
            "inline-flex items-center gap-0.5",
            status[locale] ? "text-success" : "text-destructive"
          )}
          title={`${locale.toUpperCase()} : ${
            status[locale] ? t.complete : t.incomplete
          }`}
        >
          {locale.toUpperCase()}
          {status[locale] ? "✓" : "!"}
        </span>
      ))}
    </span>
  );
}

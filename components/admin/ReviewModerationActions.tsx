"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { adminReviewMessages } from "@/lib/admin-i18n/reviews";
import { translateAdminErrorMessage } from "@/lib/admin-i18n/errors";
import { moderateReviewAction } from "@/app/admin/(dashboard)/reviews/actions";
import type { ReviewStatus } from "@/types/review";

export function ReviewModerationActions({ id, version, status }: { id: string; version: number; status: ReviewStatus }) {
  const { locale } = useAdminI18n();
  const t = adminReviewMessages[locale];
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function moderate(nextStatus: ReviewStatus) {
    setSaving(true); setError(null);
    try {
      const result = await moderateReviewAction({ id, expectedVersion: version, status: nextStatus });
      if (!result.success) setError(translateAdminErrorMessage(result.error.message, locale));
      else router.refresh();
    } catch { setError(translateAdminErrorMessage("Une erreur inattendue est survenue", locale)); }
    finally { setSaving(false); }
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "APPROVED" && <Button type="button" size="sm" disabled={saving} onClick={() => moderate("APPROVED")}>{t.approve}</Button>}
        {status !== "REJECTED" && <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => moderate("REJECTED")}>{t.reject}</Button>}
        {status !== "PENDING" && <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => moderate("PENDING")}>{t.pending}</Button>}
      </div>
      {saving && <p role="status" className="text-xs">{t.saving}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

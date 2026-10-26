"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dictionary } = useAdminI18n();
  const t = dictionary.errorPage;

  useEffect(() => {
    console.error("[app error boundary /admin]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.title}
      </h1>

      <p className="text-muted-foreground">
        {t.description}
      </p>

      <div className="flex gap-3">
        <Button onClick={reset}>{t.retry}</Button>

        <Button variant="outline" asChild>
          <Link href="/admin">{t.backToDashboard}</Link>
        </Button>
      </div>
    </div>
  );
}

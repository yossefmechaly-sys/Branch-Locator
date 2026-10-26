"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { formatCount } from "./format";

export function BranchActionsCard({
  branchLabel,
  actionsCount,
}: {
  branchLabel: string;
  actionsCount: number;
}) {
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader>
        <CardDescription>
          {t.branchResults} <span dir="auto">« {branchLabel} »</span>
        </CardDescription>
        <CardTitle className="text-3xl">{formatCount(actionsCount, locale)}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">{t.branchActionsDescription}</p>
      </CardContent>
    </Card>
  );
}

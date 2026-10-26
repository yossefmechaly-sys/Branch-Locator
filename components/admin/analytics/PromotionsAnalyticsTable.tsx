"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PromotionAnalyticsRow } from "@/types/analytics";

import { formatCount, formatRatioPercent } from "./format";

export function PromotionsAnalyticsTable({ rows }: { rows: PromotionAnalyticsRow[] }) {
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.promotions}</CardTitle>
        <CardDescription>{t.promotionsDescription}</CardDescription>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y bg-muted/40">
            <tr>
              <th className="p-3 text-start font-medium">{t.promotion}</th>
              <th className="p-3 text-start font-medium">{t.scope}</th>
              <th className="p-3 text-start font-medium">{t.branches}</th>
              <th className="p-3 text-start font-medium">{t.impressions}</th>
              <th className="p-3 text-start font-medium">{t.clicks}</th>
              <th className="p-3 text-start font-medium">{t.ctr}</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.promotionId} className="border-b last:border-0">
                <td className="p-3 font-medium">{row.title}</td>
                <td className="p-3">
                  <Badge variant={row.scope === "global" ? "default" : "secondary"}>
                    {row.scope === "global" ? t.global : t.local}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{formatCount(row.branchCount, locale)}</td>
                <td className="p-3">{formatCount(row.views, locale)}</td>
                <td className="p-3">{formatCount(row.clicks, locale)}</td>
                <td className="p-3">{formatRatioPercent(row.ctr, locale)}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  {t.noPromotionImpressions}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

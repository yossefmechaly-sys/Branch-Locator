"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsKpis } from "@/types/analytics";

import { DeltaBadge } from "./DeltaBadge";
import { formatCount } from "./format";

type KpiDef = {
  key: keyof AnalyticsKpis;
  labelKey:
    | "locatorViews"
    | "branchViews"
    | "searches"
    | "zeroResultSearches"
    | "geolocationUses"
    | "navigationClicksTotal"
    | "wazeClicks"
    | "googleMapsClicks"
    | "appleMapsClicks"
    | "calls"
    | "whatsappClicks"
    | "promotionViews"
    | "promotionClicks"
    | "visitIntent";
  highlight?: boolean;
};

const KPI_CARD_DEFS: KpiDef[] = [
  { key: "locatorViews", labelKey: "locatorViews" },
  { key: "branchViews", labelKey: "branchViews" },
  { key: "searches", labelKey: "searches" },
  { key: "zeroResultSearches", labelKey: "zeroResultSearches" },
  { key: "geolocationUsed", labelKey: "geolocationUses" },
  { key: "navigationClicks", labelKey: "navigationClicksTotal" },
  { key: "wazeClicks", labelKey: "wazeClicks" },
  { key: "googleMapsClicks", labelKey: "googleMapsClicks" },
  { key: "appleMapsClicks", labelKey: "appleMapsClicks" },
  { key: "phoneClicks", labelKey: "calls" },
  { key: "whatsappClicks", labelKey: "whatsappClicks" },
  { key: "promotionViews", labelKey: "promotionViews" },
  { key: "promotionClicks", labelKey: "promotionClicks" },
  { key: "visitIntent", labelKey: "visitIntent", highlight: true },
];

export function KpiCards({
  kpis,
  deltaPercent,
}: {
  kpis: AnalyticsKpis;
  deltaPercent: Record<keyof AnalyticsKpis, number | null>;
}) {
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {KPI_CARD_DEFS.map((def) => (
        <Card key={def.key} className={def.highlight ? "border-primary" : undefined}>
          <CardHeader>
            <CardDescription>{t[def.labelKey]}</CardDescription>
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-2xl">{formatCount(kpis[def.key], locale)}</CardTitle>
              <DeltaBadge value={deltaPercent[def.key]} />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsConversion } from "@/types/analytics";

import { formatRatioPercent } from "./format";

const CONVERSION_DEFS = [
  {
    key: "branchViewToNavigation",
    labelKey: "branchViewToNavigation",
    descriptionKey: "branchViewToNavigationDescription",
  },
  {
    key: "branchViewToPhone",
    labelKey: "branchViewToPhone",
    descriptionKey: "branchViewToPhoneDescription",
  },
  {
    key: "branchViewToWhatsapp",
    labelKey: "branchViewToWhatsapp",
    descriptionKey: "branchViewToWhatsappDescription",
  },
  {
    key: "promotionViewToClick",
    labelKey: "promotionViewToClick",
    descriptionKey: "promotionViewToClickDescription",
  },
] as const;

export function ConversionCards({ conversion }: { conversion: AnalyticsConversion }) {
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{t.interactionVisitIntent}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CONVERSION_DEFS.map((def) => (
          <Card key={def.key}>
            <CardHeader>
              <CardDescription>{t[def.labelKey]}</CardDescription>
              <CardTitle className="text-2xl">
                {formatRatioPercent(conversion[def.key], locale)}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t[def.descriptionKey]}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

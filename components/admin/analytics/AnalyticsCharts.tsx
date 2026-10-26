"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySeriesPoint } from "@/types/analytics";

const COLORS = {
  locatorViews: "#2563eb",
  branchViews: "#7c3aed",
  visitIntent: "#0891b2",
  navigationClicks: "#2563eb",
  phoneClicks: "#d97706",
  whatsappClicks: "#16a34a",
  promotionViews: "#7c3aed",
  promotionClicks: "#e11d48",
} as const;

function formatDateTick(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactElement;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <div className="h-64 px-2 pb-4 pe-5">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function AnalyticsCharts({ dailySeries }: { dailySeries: DailySeriesPoint[] }) {
  const { dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  const noData = dailySeries.every(
    (point) =>
      point.locatorViews === 0 &&
      point.branchViews === 0 &&
      point.visitIntent === 0 &&
      point.promotionViews === 0 &&
      point.promotionClicks === 0,
  );

  const tooltipLabel = (label: unknown) => `${t.day} : ${String(label)}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t.evolution}</h2>
        {noData && <span className="text-xs text-muted-foreground">{t.noActivity}</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title={t.visitsEvolution} description={t.visitsEvolutionDescription}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip labelFormatter={tooltipLabel} />
            <Legend />
            <Line type="monotone" dataKey="locatorViews" name={t.locatorViews} stroke={COLORS.locatorViews} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="branchViews" name={t.branchViews} stroke={COLORS.branchViews} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title={t.visitIntentByDay} description={t.visitIntentByDayDescription}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip labelFormatter={tooltipLabel} />
            <Line type="monotone" dataKey="visitIntent" name={t.visitIntent} stroke={COLORS.visitIntent} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title={t.navigationPhoneWhatsapp} description={t.navigationPhoneWhatsappDescription}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip labelFormatter={tooltipLabel} />
            <Legend />
            <Line type="monotone" dataKey="navigationClicks" name={t.navigation} stroke={COLORS.navigationClicks} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="phoneClicks" name={t.phone} stroke={COLORS.phoneClicks} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="whatsappClicks" name={t.whatsapp} stroke={COLORS.whatsappClicks} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title={t.promotionEngagement} description={t.promotionEngagementDescription}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={formatDateTick} fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip labelFormatter={tooltipLabel} />
            <Legend />
            <Line type="monotone" dataKey="promotionViews" name={t.promotionViews} stroke={COLORS.promotionViews} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="promotionClicks" name={t.promotionClicks} stroke={COLORS.promotionClicks} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
}

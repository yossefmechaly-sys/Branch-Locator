"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnalyticsPeriodKey } from "@/lib/analytics/period";
import { locales, localeLabels, type AppLocale } from "@/types/i18n";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

/**
 * Filtres du tableau de bord (Phase 10, §10) — formulaire GET classique
 * (même convention que `app/admin/(dashboard)/branches/page.tsx`) : l'état
 * courant vit dans l'URL, jamais dans un state client qui se perdrait au
 * rechargement ou ne serait pas partageable/liable en favori. Seul l'AFFICHAGE
 * conditionnel des deux champs de date "personnalisée" utilise un state
 * local (pure UX, aucune donnée de filtre n'y vit).
 */
export function AnalyticsFiltersForm({
  period,
  startDate,
  endDate,
  branchId,
  citySlug,
  locale,
  branches,
  cities,
}: {
  period: AnalyticsPeriodKey;
  startDate?: string;
  endDate?: string;
  branchId: string | null;
  citySlug: string | null;
  locale: AppLocale | null;
  branches: { id: string; label: string }[];
  cities: { slug: string; label: string }[];
}) {
  const [showCustom, setShowCustom] = useState(period === "custom");
  const { dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  return (
    <form method="get" className="flex flex-wrap items-end gap-2 rounded-lg border bg-background p-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="analytics-period" className="text-xs text-muted-foreground">
          {t.period}
        </label>
        <select
          id="analytics-period"
          name="period"
          defaultValue={period}
          onChange={(event) => setShowCustom(event.target.value === "custom")}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="today">{t.today}</option>
          <option value="7d">{t.last7Days}</option>
          <option value="30d">{t.last30Days}</option>
          <option value="custom">{t.customPeriod}</option>
        </select>
      </div>

      {showCustom && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="analytics-start" className="text-xs text-muted-foreground">
              {t.from}
            </label>
            <Input id="analytics-start" type="date" name="start" defaultValue={startDate} className="h-9 w-40" dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="analytics-end" className="text-xs text-muted-foreground">
              {t.to}
            </label>
            <Input id="analytics-end" type="date" name="end" defaultValue={endDate} className="h-9 w-40" dir="ltr" />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="analytics-branch" className="text-xs text-muted-foreground">
          {t.branch}
        </label>
        <select
          id="analytics-branch"
          name="branchId"
          defaultValue={branchId ?? ""}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">{t.allBranches}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="analytics-city" className="text-xs text-muted-foreground">
          {t.city}
        </label>
        <select
          id="analytics-city"
          name="city"
          defaultValue={citySlug ?? ""}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">{t.allCities}</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="analytics-locale" className="text-xs text-muted-foreground">
          {t.language}
        </label>
        <select
          id="analytics-locale"
          name="locale"
          defaultValue={locale ?? ""}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">{t.allLanguages}</option>
          {locales.map((code) => (
            <option key={code} value={code}>
              {localeLabels[code]}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="outline" size="sm">
        {t.filter}
      </Button>
      {(branchId || citySlug || locale || period !== "7d") && (
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/analytics">{t.reset}</Link>
        </Button>
      )}
    </form>
  );
}

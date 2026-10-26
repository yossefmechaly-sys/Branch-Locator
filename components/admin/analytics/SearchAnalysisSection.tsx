"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localeLabels } from "@/types/i18n";
import type { SearchAnalysis } from "@/types/analytics";

import { formatCount, formatRatioPercent } from "./format";

export function SearchAnalysisSection({ search }: { search: SearchAnalysis }) {
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{t.searchAnalysis}</h2>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardDescription>{t.zeroResultSearches}</CardDescription>
            <CardTitle className="text-2xl">
              {formatCount(search.zeroResultCount, locale)}{" "}
              <span className="text-base font-normal text-muted-foreground">
                ({formatRatioPercent(search.zeroResultRate, locale)} {t.ofSearches})
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t.zeroResultRateDescription}</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t.searchLanguages}</CardDescription>
          </CardHeader>

          <div className="px-5 pb-1">
            {search.localeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noSearches}</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {search.localeBreakdown.map((entry) => (
                  <li key={entry.locale} className="flex items-center justify-between gap-3">
                    <span>{localeLabels[entry.locale] ?? entry.locale}</span>
                    <span className="font-medium">{formatCount(entry.count, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.topCities}</CardTitle>
          </CardHeader>

          <div className="px-5 pb-4">
            {search.topCities.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noCityMatches}</p>
            ) : (
              <ol className="flex flex-col gap-1.5 text-sm">
                {search.topCities.map((entry) => (
                  <li key={entry.citySlug} className="flex items-center justify-between gap-3">
                    <span>{entry.cityName}</span>
                    <span className="font-medium">{formatCount(entry.count, locale)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.topBranches}</CardTitle>
          </CardHeader>

          <div className="px-5 pb-4">
            {search.topBranches.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noBranchMatches}</p>
            ) : (
              <ol className="flex flex-col gap-1.5 text-sm">
                {search.topBranches.map((entry) => (
                  <li key={entry.branchId} className="flex items-center justify-between gap-3">
                    <span>{entry.displayName}</span>
                    <span className="font-medium">{formatCount(entry.count, locale)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

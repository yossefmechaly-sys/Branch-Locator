"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopBranchRow } from "@/types/analytics";

import { formatCount } from "./format";

type SortKey = keyof Pick<
  TopBranchRow,
  | "branchViews"
  | "navigationClicks"
  | "phoneClicks"
  | "whatsappClicks"
  | "promotionViews"
  | "promotionClicks"
  | "visitIntent"
>;

const COLUMNS = [
  { key: "branchViews", labelKey: "views" },
  { key: "navigationClicks", labelKey: "navigation" },
  { key: "phoneClicks", labelKey: "phone" },
  { key: "whatsappClicks", labelKey: "whatsapp" },
  { key: "promotionViews", labelKey: "promoViews" },
  { key: "promotionClicks", labelKey: "promoClicks" },
  { key: "visitIntent", labelKey: "visitIntent" },
] as const satisfies readonly { key: SortKey; labelKey: string }[];

export function TopBranchesTable({ rows }: { rows: TopBranchRow[] }) {
  const { locale, dictionary } = useAdminI18n();
  const t = dictionary.analytics;

  const [sortKey, setSortKey] = useState<SortKey>("visitIntent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) =>
      sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey],
    );
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.bestBranches}</CardTitle>
        <CardDescription>{t.bestBranchesDescription}</CardDescription>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y bg-muted/40">
            <tr>
              <th className="p-3 text-start font-medium">{t.branch}</th>
              <th className="p-3 text-start font-medium">{t.city}</th>

              {COLUMNS.map((col) => (
                <th key={col.key} className="p-3 text-start font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {t[col.labelKey]}
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.branchId} className="border-b last:border-0">
                <td className="p-3 font-medium">{row.displayName}</td>
                <td className="p-3 text-muted-foreground">{row.cityName}</td>
                <td className="p-3">{formatCount(row.branchViews, locale)}</td>
                <td className="p-3">{formatCount(row.navigationClicks, locale)}</td>
                <td className="p-3">{formatCount(row.phoneClicks, locale)}</td>
                <td className="p-3">{formatCount(row.whatsappClicks, locale)}</td>
                <td className="p-3">{formatCount(row.promotionViews, locale)}</td>
                <td className="p-3">{formatCount(row.promotionClicks, locale)}</td>
                <td className="p-3 font-medium">{formatCount(row.visitIntent, locale)}</td>
              </tr>
            ))}

            {sortedRows.length === 0 && (
              <tr>
                <td
                  colSpan={2 + COLUMNS.length}
                  className="p-6 text-center text-muted-foreground"
                >
                  {t.noBranchActivity}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

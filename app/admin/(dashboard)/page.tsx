import Link from "next/link";
import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { getAdminDashboardStats } from "@/services/admin/dashboard.service";
import { adminReviewMessages } from "@/lib/admin-i18n/reviews";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function AdminDashboardPage() {
  const [stats, locale] = await Promise.all([
    getAdminDashboardStats(),
    getAdminLocale(),
  ]);

  const dictionary = getAdminDictionary(locale);
  const t = dictionary.dashboard;

  const statCards = [
    { key: "totalBranches", label: t.totalBranches },
    { key: "activeBranches", label: t.activeBranches },
    { key: "inactiveBranches", label: t.inactiveBranches },
    { key: "openNowBranches", label: t.openNowBranches },
    { key: "totalCities", label: t.totalCities },
    { key: "activePromotions", label: t.activePromotions },
    { key: "scheduledPromotions", label: t.scheduledPromotions },
  ] as const;

  const dateLocale =
    locale === "he" ? "he-IL" : locale === "en" ? "en-US" : "fr-FR";

  const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat(dateLocale, {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Asia/Jerusalem",
    }).format(new Date(iso));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.title}
      </h1>

      <Link href="/admin/reviews" className="text-sm font-medium underline">{adminReviewMessages[locale].title}</Link>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">
                {stats[card.key]}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.recentChanges}</CardTitle>
          <CardDescription>
            {t.recentChangesDescription}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {stats.recentChanges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.noChanges}
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {stats.recentChanges.map((change) => (
                <li
                  key={`${change.entityType}-${change.id}`}
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                >
                  <Link
                    href={
                      change.entityType === "Branch"
                        ? `/admin/branches/${change.id}/edit`
                        : `/admin/promotions/${change.id}/edit`
                    }
                    className="hover:underline"
                  >
                    <span className="text-muted-foreground">
                      {change.entityType === "Branch"
                        ? t.branch
                        : t.promotion}{" "}
                      ·{" "}
                    </span>
                    {change.label}
                  </Link>

                  <span
                    className="text-muted-foreground"
                    dir="ltr"
                  >
                    {formatDateTime(change.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

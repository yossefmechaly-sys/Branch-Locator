import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { listAdminPromotions } from "@/services/admin/promotion-admin.service";

import { PromotionRowActions } from "./PromotionRowActions";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function AdminPromotionsPage() {
  const [promotions, session, locale] = await Promise.all([
    listAdminPromotions(),
    auth(),
    getAdminLocale(),
  ]);

  const role = session!.user.role;
  const canDeactivate = hasPermission(role, "deactivate");
  const canHardDelete = hasPermission(role, "hardDelete");

  const dictionary = getAdminDictionary(locale);
  const t = dictionary.promotions;
  const common = dictionary.common;
  const dateLocale =
    locale === "he" ? "he-IL" : locale === "en" ? "en-US" : "fr-FR";

  const statusLabels: Record<string, string> = {
    DRAFT: t.statuses.draft,
    SCHEDULED: t.statuses.scheduled,
    ACTIVE: t.statuses.active,
    EXPIRED: t.statuses.expired,
    ARCHIVED: t.statuses.archived,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.title}
        </h1>

        <Button asChild>
          <Link href="/admin/promotions/new">
            {t.newPromotion}
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-start">
            <tr>
              <th className="p-3 text-start font-medium">
                {t.productTitle}
              </th>
              <th className="p-3 text-start font-medium">
                {common.translations}
              </th>
              <th className="p-3 text-start font-medium">
                {common.status}
              </th>
              <th className="p-3 text-start font-medium">
                {t.price}
              </th>
              <th className="p-3 text-start font-medium">
                {t.scope}
              </th>
              <th className="p-3 text-start font-medium">
                {t.featured}
              </th>
              <th className="p-3 text-start font-medium">
                {t.priority}
              </th>
              <th className="p-3 text-start font-medium">
                {common.modified}
              </th>
              <th className="p-3 text-start font-medium">
                {common.actions}
              </th>
            </tr>
          </thead>

          <tbody>
            {promotions.map((promotion) => (
              <tr
                key={promotion.id}
                className="border-b last:border-0"
              >
                <td className="p-3 font-medium">
                  {promotion.title}
                </td>

                <td className="p-3">
                  <TranslationStatusBadges
                    status={promotion.translationStatus}
                  />
                </td>

                <td className="p-3">
                  <Badge
                    variant={
                      promotion.status === "ACTIVE"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {statusLabels[promotion.status] ??
                      promotion.status}
                  </Badge>
                </td>

                <td className="p-3" dir="ltr">
                  {promotion.price
                    ? `${promotion.price} ${promotion.currency}`
                    : "—"}
                </td>

                <td className="p-3">
                  {promotion.appliesToAll
                    ? t.allBranches
                    : `${promotion.branchCount} ${t.branchCount}`}
                </td>

                <td className="p-3">
                  {promotion.isFeatured ? "🔥" : "—"}
                </td>

                <td className="p-3">
                  {promotion.priority}
                </td>

                <td className="p-3 text-muted-foreground">
                  {new Intl.DateTimeFormat(dateLocale, {
                    dateStyle: "short",
                    timeZone: "Asia/Jerusalem",
                  }).format(new Date(promotion.updatedAt))}
                </td>

                <td className="p-3">
                  <PromotionRowActions
                    id={promotion.id}
                    canDeactivate={canDeactivate}
                    canHardDelete={canHardDelete}
                  />
                </td>
              </tr>
            ))}

            {promotions.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-6 text-center text-muted-foreground"
                >
                  {t.noResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

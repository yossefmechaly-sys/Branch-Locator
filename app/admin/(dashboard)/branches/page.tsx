import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { listAdminBranches } from "@/services/admin/branch-admin.service";
import { listCityOptions } from "@/services/admin/city-admin.service";

import { BranchRowActions } from "./BranchRowActions";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function AdminBranchesPage(props: {
  searchParams: Promise<{ q?: string; city?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;

  const [branches, cityOptions, session, locale] = await Promise.all([
    listAdminBranches({
      q: searchParams.q,
      cityId: searchParams.city,
      isActive:
        searchParams.status === "active"
          ? true
          : searchParams.status === "inactive"
            ? false
            : undefined,
    }),
    listCityOptions(),
    auth(),
    getAdminLocale(),
  ]);

  const role = session!.user.role;
  const dictionary = getAdminDictionary(locale);
  const t = dictionary.branches;
  const common = dictionary.common;
  const dateLocale =
    locale === "he" ? "he-IL" : locale === "en" ? "en-US" : "fr-FR";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.title}
        </h1>

        <Button asChild>
          <Link href="/admin/branches/new">{t.newBranch}</Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <Input
          name="q"
          placeholder={t.searchPlaceholder}
          defaultValue={searchParams.q}
          className="w-64"
        />

        <select
          name="city"
          defaultValue={searchParams.city ?? ""}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">{t.allCities}</option>
          {cityOptions.map((city) => (
            <option key={city.id} value={city.id}>
              {city.label}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">{t.allStatuses}</option>
          <option value="active">{t.activePlural}</option>
          <option value="inactive">{t.inactivePlural}</option>
        </select>

        <Button type="submit" variant="outline" size="sm">
          {common.filter}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="p-3 text-start font-medium">{t.name}</th>
              <th className="p-3 text-start font-medium">{t.code}</th>
              <th className="p-3 text-start font-medium">{t.city}</th>
              <th className="p-3 text-start font-medium">
                {common.translations}
              </th>
              <th className="p-3 text-start font-medium">
                {common.status}
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
            {branches.map((branch) => (
              <tr key={branch.id} className="border-b last:border-0">
                <td className="p-3 font-medium">
                  {branch.displayName}
                </td>

                <td className="p-3 text-muted-foreground" dir="ltr">
                  {branch.branchCode}
                </td>

                <td className="p-3">{branch.cityName}</td>

                <td className="p-3">
                  <TranslationStatusBadges
                    status={branch.translationStatus}
                  />
                </td>

                <td className="p-3">
                  <Badge
                    variant={
                      branch.isActive ? "success" : "secondary"
                    }
                  >
                    {branch.isActive
                      ? common.active
                      : common.inactive}
                  </Badge>
                </td>

                <td className="p-3 text-muted-foreground">
                  {new Intl.DateTimeFormat(dateLocale, {
                    dateStyle: "short",
                    timeZone: "Asia/Jerusalem",
                  }).format(new Date(branch.updatedAt))}
                </td>

                <td className="p-3">
                  <BranchRowActions
                    id={branch.id}
                    isActive={branch.isActive}
                    canDeactivate={hasPermission(role, "deactivate")}
                    canHardDelete={hasPermission(role, "hardDelete")}
                  />
                </td>
              </tr>
            ))}

            {branches.length === 0 && (
              <tr>
                <td
                  colSpan={7}
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

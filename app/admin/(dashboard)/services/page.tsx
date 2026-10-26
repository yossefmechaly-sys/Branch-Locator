import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { listAdminServices } from "@/services/admin/service-admin.service";

import { ServiceRowActions } from "./ServiceRowActions";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function AdminServicesPage() {
  const [services, session, locale] = await Promise.all([
    listAdminServices(),
    auth(),
    getAdminLocale(),
  ]);

  const role = session!.user.role;
  const dictionary = getAdminDictionary(locale);
  const t = dictionary.services;
  const common = dictionary.common;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.title}
        </h1>

        <Button asChild>
          <Link href="/admin/services/new">
            {t.newService}
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="p-3 text-start font-medium">
                {t.name}
              </th>
              <th className="p-3 text-start font-medium">
                {t.slug}
              </th>
              <th className="p-3 text-start font-medium">
                {common.translations}
              </th>
              <th className="p-3 text-start font-medium">
                {common.status}
              </th>
              <th className="p-3 text-start font-medium">
                {t.branches}
              </th>
              <th className="p-3 text-start font-medium">
                {common.actions}
              </th>
            </tr>
          </thead>

          <tbody>
            {services.map((service) => (
              <tr
                key={service.id}
                className="border-b last:border-0"
              >
                <td className="p-3 font-medium">
                  {service.name}
                </td>

                <td
                  className="p-3 text-muted-foreground"
                  dir="ltr"
                >
                  {service.slug}
                </td>

                <td className="p-3">
                  <TranslationStatusBadges
                    status={service.translationStatus}
                  />
                </td>

                <td className="p-3">
                  <Badge
                    variant={
                      service.isActive ? "success" : "secondary"
                    }
                  >
                    {service.isActive
                      ? common.active
                      : common.inactive}
                  </Badge>
                </td>

                <td className="p-3">
                  {service.branchCount}
                </td>

                <td className="p-3">
                  <ServiceRowActions
                    id={service.id}
                    isActive={service.isActive}
                    branchCount={service.branchCount}
                    canDeactivate={hasPermission(
                      role,
                      "deactivate",
                    )}
                    canHardDelete={hasPermission(
                      role,
                      "hardDelete",
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

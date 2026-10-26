import type { Metadata } from "next";

import { BranchForm } from "@/components/admin/BranchForm";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { listCityOptions } from "@/services/admin/city-admin.service";
import { listServiceOptions } from "@/services/admin/service-admin.service";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function NewBranchPage() {
  const [cityOptions, serviceOptions, locale] = await Promise.all([
    listCityOptions(),
    listServiceOptions(),
    getAdminLocale(),
  ]);

  const t = getAdminDictionary(locale).branches;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.newBranch}
      </h1>

      <BranchForm
        mode="create"
        cityOptions={cityOptions}
        serviceOptions={serviceOptions}
      />
    </div>
  );
}

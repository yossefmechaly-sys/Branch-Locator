import type { Metadata } from "next";

import { CityForm } from "@/components/admin/CityForm";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function NewCityPage() {
  const locale = await getAdminLocale();
  const t = getAdminDictionary(locale).cities;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.newCity}
      </h1>
      <CityForm mode="create" />
    </div>
  );
}

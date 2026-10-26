import type { Metadata } from "next";

import { ServiceForm } from "@/components/admin/ServiceForm";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { emptyServiceFormValues } from "@/lib/admin/service-form-values";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function NewServicePage() {
  const locale = await getAdminLocale();
  const t = getAdminDictionary(locale).services;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.newService}
      </h1>

      <ServiceForm
        mode="create"
        initial={emptyServiceFormValues()}
      />
    </div>
  );
}

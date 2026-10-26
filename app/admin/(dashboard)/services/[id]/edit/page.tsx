import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceForm } from "@/components/admin/ServiceForm";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { getAdminServiceById } from "@/services/admin/service-admin.service";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function EditServicePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [service, locale] = await Promise.all([
    getAdminServiceById(id),
    getAdminLocale(),
  ]);

  if (!service) notFound();

  const t = getAdminDictionary(locale).services;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.editService}{" "}
        <span dir="ltr">« {service.slug} »</span>
      </h1>

      <ServiceForm
        mode="edit"
        serviceId={service.id}
        initialVersion={service.version}
        initial={{
          slug: service.slug,
          icon: service.icon,
          isActive: service.isActive,
          sortOrder: service.sortOrder,
          translations: service.translations,
        }}
      />
    </div>
  );
}

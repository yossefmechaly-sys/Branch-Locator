import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CityForm } from "@/components/admin/CityForm";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { getAdminCityById } from "@/services/admin/city-admin.service";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function EditCityPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [city, locale] = await Promise.all([
    getAdminCityById(id),
    getAdminLocale(),
  ]);

  if (!city) notFound();

  const t = getAdminDictionary(locale).cities;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.editCity} <span dir="ltr">« {city.slug} »</span>
      </h1>

      <CityForm
        mode="edit"
        cityId={city.id}
        initialVersion={city.version}
        initial={{
          slug: city.slug,
          latitude:
            city.latitude === null ? "" : String(city.latitude),
          longitude:
            city.longitude === null ? "" : String(city.longitude),
          isActive: city.isActive,
          sortOrder: city.sortOrder,
          translations: city.translations,
        }}
      />
    </div>
  );
}

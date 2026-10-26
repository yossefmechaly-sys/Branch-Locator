import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BranchForm, type BranchFormValues } from "@/components/admin/BranchForm";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { adminReviewMessages } from "@/lib/admin-i18n/reviews";
import { getAdminBranchById } from "@/services/admin/branch-admin.service";
import { listCityOptions } from "@/services/admin/city-admin.service";
import { listServiceOptions } from "@/services/admin/service-admin.service";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function EditBranchPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [branch, cityOptions, serviceOptions, locale] = await Promise.all([
    getAdminBranchById(id),
    listCityOptions(),
    listServiceOptions(),
    getAdminLocale(),
  ]);

  if (!branch) notFound();

  const t = getAdminDictionary(locale).branches;

  const initial: BranchFormValues = {
    slug: branch.slug,
    branchCode: branch.branchCode,
    cityId: branch.cityId,
    district: branch.district ?? "",
    address: branch.address,
    postalCode: branch.postalCode ?? "",
    latitude: String(branch.latitude),
    longitude: String(branch.longitude),
    phone: branch.phone ?? "",
    email: branch.email ?? "",
    whatsappNumber: branch.whatsappNumber ?? "",
    whatsappGroupUrl: branch.whatsappGroupUrl ?? "",
    wazeUrlOverride: branch.wazeUrlOverride ?? "",
    mainImage: branch.mainImage ?? "",
    isActive: branch.isActive,
    sortOrder: branch.sortOrder,
    serviceIds: branch.serviceIds,
    openingHours: branch.openingHours,
    specialHours: branch.specialHours.map((entry) => ({
      clientId: entry.id,
      date: entry.date,
      title: entry.title ?? "",
      isClosed: entry.isClosed,
      openingTime: entry.openingTime ?? "",
      closingTime: entry.closingTime ?? "",
      openingTime2: entry.openingTime2 ?? "",
      closingTime2: entry.closingTime2 ?? "",
    })),
    images: branch.images.map((image) => ({
      clientId: image.id,
      imageUrl: image.imageUrl,
      alt: image.alt ?? "",
      sortOrder: image.sortOrder,
    })),
    translations: branch.translations,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.editBranch} <span dir="ltr">« {branch.slug} »</span>
        </h1>
        {/* Phase 10, §19 : accès direct aux statistiques de CE magasin —
            jamais besoin de repasser par les filtres du tableau de bord
            global pour un responsable régional qui ne suit qu'un magasin. */}
        <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/reviews?branchId=${branch.id}`}>{adminReviewMessages[locale].title}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/analytics?branchId=${branch.id}`}>{t.viewAnalytics}</Link>
        </Button>
        </div>
      </div>
      <BranchForm
        mode="edit"
        branchId={branch.id}
        initialVersion={branch.version}
        initial={initial}
        cityOptions={cityOptions}
        serviceOptions={serviceOptions}
      />
    </div>
  );
}

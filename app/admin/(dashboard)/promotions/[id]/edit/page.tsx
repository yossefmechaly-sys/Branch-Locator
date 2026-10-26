import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PromotionForm, type PromotionFormValues } from "@/components/admin/PromotionForm";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { getAdminPromotionById, listBranchOptions } from "@/services/admin/promotion-admin.service";
import { locales } from "@/types/i18n";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function EditPromotionPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [promotion, branchOptions, locale] = await Promise.all([
    getAdminPromotionById(id),
    listBranchOptions(),
    getAdminLocale(),
  ]);

  if (!promotion) notFound();

  const t = getAdminDictionary(locale).promotions;

  const initial: PromotionFormValues = {
    slug: promotion.slug,
    image: promotion.image ?? "",
    price: promotion.price ?? "",
    originalPrice: promotion.originalPrice ?? "",
    currency: promotion.currency,
    unit: promotion.unit,
    startDate: promotion.startDate,
    endDate: promotion.endDate,
    url: promotion.url ?? "",
    status: promotion.status,
    appliesToAll: promotion.appliesToAll,
    branchIds: promotion.branchIds,
    isFeatured: promotion.isFeatured,
    priority: promotion.priority,
    translations: locales.map((locale) => {
      const t = promotion.translations.find((entry) => entry.locale === locale)!;
      return {
        locale,
        productName: t.productName ?? "",
        title: t.title,
        description: t.description ?? "",
        ctaLabel: t.ctaLabel ?? "",
      };
    }),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.editPromotion} <span dir="ltr">« {promotion.slug} »</span>
      </h1>
      <PromotionForm
        mode="edit"
        promotionId={promotion.id}
        initialVersion={promotion.version}
        initial={initial}
        branchOptions={branchOptions}
      />
    </div>
  );
}

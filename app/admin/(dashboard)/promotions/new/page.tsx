import type { Metadata } from "next";

import { PromotionForm } from "@/components/admin/PromotionForm";
import { emptyPromotionFormValues } from "@/lib/admin/promotion-form-values";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { listBranchOptions } from "@/services/admin/promotion-admin.service";

export const metadata: Metadata = { title: "Branch Locator Admin" };

export default async function NewPromotionPage() {
  const [branchOptions, locale] = await Promise.all([
    listBranchOptions(),
    getAdminLocale(),
  ]);

  const t = getAdminDictionary(locale).promotions;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.newPromotion}</h1>
      <PromotionForm mode="create" initial={emptyPromotionFormValues()} branchOptions={branchOptions} />
    </div>
  );
}

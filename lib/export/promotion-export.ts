import { locales } from "@/types/i18n";

import type { ExportColumn } from "./table";

/**
 * Export promotions (Phase 10, §33 — « si raisonnable ») — colonnes alignées
 * sur `PromotionInput` (Phase 9, §11), `price`/`originalPrice` restent des
 * CHAÎNES décimales de bout en bout, jamais `Number(...)` (même impératif que
 * pour l'admin lui-même).
 */
export interface PromotionExportRow {
  slug: string;
  price: string | null;
  originalPrice: string | null;
  currency: string;
  unit: string;
  startDate: string;
  endDate: string;
  status: string;
  appliesToAll: boolean;
  isFeatured: boolean;
  priority: number;
  branchCodes: string[];
  translations: { locale: string; productName: string | null; title: string }[];
}

export const PROMOTION_EXPORT_COLUMNS: ExportColumn<PromotionExportRow>[] = [
  { key: "slug", label: "slug", value: (r) => r.slug },
  { key: "price", label: "price", value: (r) => r.price ?? "" },
  { key: "originalPrice", label: "originalPrice", value: (r) => r.originalPrice ?? "" },
  { key: "currency", label: "currency", value: (r) => r.currency },
  { key: "unit", label: "unit", value: (r) => r.unit },
  { key: "startDate", label: "startDate", value: (r) => r.startDate },
  { key: "endDate", label: "endDate", value: (r) => r.endDate },
  { key: "status", label: "status", value: (r) => r.status },
  { key: "appliesToAll", label: "appliesToAll", value: (r) => (r.appliesToAll ? "vrai" : "faux") },
  { key: "isFeatured", label: "isFeatured", value: (r) => (r.isFeatured ? "vrai" : "faux") },
  { key: "priority", label: "priority", value: (r) => String(r.priority) },
  {
    key: "branchCodes",
    label: "branchCodes",
    value: (r) => (r.appliesToAll ? "" : r.branchCodes.join(";")),
  },
  ...locales.map((locale): ExportColumn<PromotionExportRow> => ({
    key: `title_${locale}`,
    label: `title_${locale}`,
    value: (r) => r.translations.find((t) => t.locale === locale)?.title ?? "",
  })),
  ...locales.map((locale): ExportColumn<PromotionExportRow> => ({
    key: `productName_${locale}`,
    label: `productName_${locale}`,
    value: (r) => r.translations.find((t) => t.locale === locale)?.productName ?? "",
  })),
];

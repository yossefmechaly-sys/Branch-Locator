import { locales, type AppLocale } from "@/types/i18n";
import type {
  PromotionCurrency,
  PromotionStatus,
  PromotionUnit,
} from "@/types/promotion";

export interface TranslationValues {
  locale: AppLocale;
  productName: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export interface PromotionFormValues {
  slug: string;
  image: string;
  price: string;
  originalPrice: string;
  currency: PromotionCurrency;
  unit: PromotionUnit;
  startDate: string;
  endDate: string;
  url: string;
  status: PromotionStatus;
  appliesToAll: boolean;
  branchIds: string[];
  isFeatured: boolean;
  priority: number;
  translations: TranslationValues[];
}

export function emptyPromotionFormValues(): PromotionFormValues {
  return {
    slug: "",
    image: "",
    price: "",
    originalPrice: "",
    currency: "ILS",
    unit: "UNIT",
    startDate: "",
    endDate: "",
    url: "",
    status: "DRAFT",
    appliesToAll: true,
    branchIds: [],
    isFeatured: false,
    priority: 0,
    translations: locales.map((locale) => ({
      locale,
      productName: "",
      title: "",
      description: "",
      ctaLabel: "",
    })),
  };
}

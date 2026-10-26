import { locales, type AppLocale } from "@/types/i18n";

export interface ServiceFormValues {
  slug: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  translations: {
    locale: AppLocale;
    name: string;
    description: string;
  }[];
}

export function emptyServiceFormValues(): ServiceFormValues {
  return {
    slug: "",
    icon: "store",
    isActive: true,
    sortOrder: 0,
    translations: locales.map((locale) => ({
      locale,
      name: "",
      description: "",
    })),
  };
}

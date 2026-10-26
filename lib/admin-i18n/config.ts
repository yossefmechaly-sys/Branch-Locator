export const ADMIN_LOCALES = ["fr", "en", "he"] as const;

export type AdminLocale = (typeof ADMIN_LOCALES)[number];

export const ADMIN_DEFAULT_LOCALE: AdminLocale = "fr";

export const ADMIN_LOCALE_COOKIE = "admin_locale";

export function isAdminLocale(value: unknown): value is AdminLocale {
  return (
    typeof value === "string" &&
    ADMIN_LOCALES.includes(value as AdminLocale)
  );
}

export function getAdminDirection(locale: AdminLocale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}

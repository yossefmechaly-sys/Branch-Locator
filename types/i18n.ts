/**
 * Source unique de vérité pour les langues supportées par l'application.
 *
 * Toute nouvelle langue s'ajoute UNIQUEMENT ici (+ un fichier `messages/{locale}.json`
 * + les lignes de traduction en base). Aucun autre fichier ne doit contenir de liste
 * de locales codée en dur — next-intl, Prisma (`Locale` enum) et les validateurs Zod
 * se basent tous sur ce module.
 */

export const locales = ["he", "en", "ru", "fr", "es"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "he";

/** Langues qui s'affichent de droite à gauche. */
export const rtlLocales: readonly AppLocale[] = ["he"];

export function isRtl(locale: AppLocale): boolean {
  return rtlLocales.includes(locale);
}

export function getDirection(locale: AppLocale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/** Métadonnées d'affichage du sélecteur de langue (`LanguageSwitcher`). */
export const localeLabels: Record<AppLocale, string> = {
  he: "עברית",
  en: "English",
  ru: "Русский",
  fr: "Français",
  es: "Español",
};

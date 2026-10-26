import { defaultLocale, type AppLocale } from "@/types/i18n";
import type { LocaleFallbackInfo } from "@/types/branch";

/**
 * Résolution d'une traduction avec repli vers l'hébreu (langue de référence,
 * toujours obligatoire — voir les validateurs Zod `lib/validators/*`) si la
 * langue demandée n'a pas (encore) de traduction. C'est le SEUL endroit de
 * l'application où cette règle de repli est implémentée (cahier des charges §4).
 */
export interface TranslationResolution<T extends { locale: AppLocale }> {
  translation: T;
  fallbackInfo: LocaleFallbackInfo;
}

export function resolveTranslation<T extends { locale: AppLocale }>(
  translations: readonly T[],
  requestedLocale: AppLocale
): TranslationResolution<T> {
  const exact = translations.find((translation) => translation.locale === requestedLocale);
  if (exact) {
    return {
      translation: exact,
      fallbackInfo: {
        requestedLocale,
        resolvedLocale: requestedLocale,
        usedFallback: false,
      },
    };
  }

  const fallback =
    translations.find((translation) => translation.locale === defaultLocale) ?? translations[0];

  if (!fallback) {
    throw new Error(
      "Aucune traduction disponible, pas même en hébreu — donnée invalide (voir les validateurs Zod, la traduction he est censée être obligatoire à la création)."
    );
  }

  return {
    translation: fallback,
    fallbackInfo: {
      requestedLocale,
      resolvedLocale: fallback.locale,
      usedFallback: true,
    },
  };
}

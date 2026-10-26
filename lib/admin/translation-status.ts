import { locales, type AppLocale } from "@/types/i18n";

/**
 * État de complétude par langue (Phase 9, §16) — LA SEULE fonction qui
 * calcule "HE ✓ / EN ✓ / RU ! / FR ✓ / ES !" pour magasins/villes/services/
 * promotions, jamais un calcul recopié par écran. Générique sur `T`
 * (`isComplete` définit ce que "complet" signifie pour CE type de
 * traduction) : aucune colonne `titleFr`/`nameEn` n'existe ni n'est
 * nécessaire ici, uniquement une lecture de la liste de traductions déjà
 * chargée (§16 : « ne jamais créer de colonnes telles que titleFr »).
 */
export type TranslationStatus = Record<AppLocale, boolean>;

export function computeTranslationStatus<T extends { locale: string }>(
  translations: readonly T[],
  isComplete: (translation: T) => boolean
): TranslationStatus {
  const status = {} as TranslationStatus;
  for (const locale of locales) {
    const translation = translations.find((entry) => entry.locale === locale);
    status[locale] = Boolean(translation && isComplete(translation));
  }
  return status;
}

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { OPENING_HOURS_TIMEZONE } from "@/lib/opening-hours/config";

import { routing } from "./routing";

/**
 * Résolution de la locale + chargement du catalogue de messages pour chaque requête.
 * Consommé par le plugin `next-intl/plugin` (voir `next.config.ts`).
 *
 * Si la locale demandée n'est pas supportée (URL corrompue, etc.), on retombe
 * silencieusement sur l'hébreu plutôt que de faire échouer le rendu.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    timeZone: OPENING_HOURS_TIMEZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

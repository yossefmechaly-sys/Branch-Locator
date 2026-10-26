import { defineRouting } from "next-intl/routing";

import { locales, defaultLocale } from "@/types/i18n";

/**
 * Configuration de routage next-intl.
 *
 * `localePrefix: "always"` garantit que l'hébreu (langue par défaut) apparaît lui
 * aussi dans l'URL (`/he/branches`, jamais `/branches`) — cohérent avec le cahier
 * des charges (§7) qui exige des URLs localisées pour les cinq langues, y compris
 * l'hébreu.
 *
 * Le cookie `NEXT_LOCALE` mémorise la préférence utilisateur (§9 : priorité
 * URL > préférence enregistrée > cookie > langue navigateur > hébreu par défaut).
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
  localeDetection: true,
});

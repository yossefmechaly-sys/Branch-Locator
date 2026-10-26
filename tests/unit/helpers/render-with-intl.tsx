import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { getDirection, type AppLocale } from "@/types/i18n";

import enMessages from "@/messages/en.json";
import heMessages from "@/messages/he.json";
import ruMessages from "@/messages/ru.json";
import frMessages from "@/messages/fr.json";
import esMessages from "@/messages/es.json";

const MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  en: enMessages,
  he: heMessages,
  ru: ruMessages,
  fr: frMessages,
  es: esMessages,
};

/**
 * Rend un composant sous un vrai `NextIntlClientProvider`, avec les mêmes
 * catalogues que l'application (`messages/{locale}.json`) — jamais de
 * chaînes de test bricolées à la main, pour que ces tests détectent une
 * vraie clé manquante/mal orthographiée comme le ferait l'app (§14/§24).
 *
 * Pose aussi `dir` sur le conteneur, comme `app/[locale]/layout.tsx` le fait
 * sur `<html>`, pour que les tests RTL/LTR restent représentatifs.
 */
export function renderWithIntl(ui: ReactElement, locale: AppLocale = "en"): RenderResult {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <div dir={getDirection(locale)}>{ui}</div>
    </NextIntlClientProvider>
  );
}

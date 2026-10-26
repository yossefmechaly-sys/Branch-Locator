"use client";

import { NextIntlClientProvider } from "next-intl";

import { PromotionCard } from "@/components/branches/PromotionCard";
import type { LocalizedPromotion } from "@/types/promotion";
import type { AppLocale } from "@/types/i18n";
import { OPENING_HOURS_TIMEZONE } from "@/lib/opening-hours/config";

import heMessages from "@/messages/he.json";
import enMessages from "@/messages/en.json";

const PREVIEW_MESSAGES: Record<"he" | "en", Record<string, unknown>> = {
  he: heMessages,
  en: enMessages,
};

/**
 * Aperçu `PromotionCard` dans l'admin (Phase 9, §15) — réutilise LE composant
 * public tel quel (jamais un troisième rendu visuel de promotion), enveloppé
 * dans son propre `NextIntlClientProvider` puisque `/admin` ne passe pas par
 * `app/[locale]/layout.tsx` (le back-office n'est pas localisé, §2). Limité à
 * HE/EN pour l'aperçu — suffisant pour vérifier visuellement une saisie,
 * jamais un usage de production de ces messages hors du site public.
 */
export function PromotionPreview({
  promotion,
  locale,
}: {
  promotion: LocalizedPromotion;
  locale: "he" | "en";
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={PREVIEW_MESSAGES[locale]}
      timeZone={OPENING_HOURS_TIMEZONE}
    >
      <div dir={locale === "he" ? "rtl" : "ltr"} className="max-w-sm">
        <PromotionCard promotion={promotion} branchId="preview" locale={locale as AppLocale} />
      </div>
    </NextIntlClientProvider>
  );
}

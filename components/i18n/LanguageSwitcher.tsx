"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Globe } from "lucide-react";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { track } from "@/lib/analytics/track";
import { locales, localeLabels, type AppLocale } from "@/types/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Sélecteur de langue (§8 du cahier des charges).
 *
 * Changer de langue ne modifie QUE le segment `[locale]` de l'URL courante :
 * `router.replace({ pathname, params }, { locale })` réutilise le pathname next-intl
 * (sans le préfixe de locale) et les paramètres de route actuels (ex. `slug` d'une
 * fiche magasin), donc `/he/branches/jerusalem-ramot` devient bien
 * `/fr/branches/jerusalem-ramot` — jamais un renvoi vers l'accueil.
 */
export function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const activeLocale = useLocale() as AppLocale;
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  function handleChange(nextLocale: string) {
    // Phase 10, §3 — la langue DE DESTINATION, jamais celle de départ (voir
    // `lib/analytics/normalize.ts`).
    track({ name: "language_changed", locale: nextLocale as AppLocale });
    router.replace(
      // @ts-expect-error -- `params` provient de `useParams()` (générique côté next/navigation) ;
      // next-intl attend les paramètres typés selon `Pathnames`, non configuré ici (routage simple).
      { pathname, params },
      { locale: nextLocale as AppLocale }
    );
  }

  return (
    <Select value={activeLocale} onValueChange={handleChange}>
      <SelectTrigger size="sm" aria-label={t("srLabel")} className="gap-1.5">
        <Globe className="size-4" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {localeLabels[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { locales, localeLabels, type AppLocale } from "@/types/i18n";
import type { TranslationStatus } from "@/lib/admin/translation-status";

/**
 * Onglets de traduction HE/EN/RU/FR/ES (Phase 9, §4/§7/§8/§11/§16) — utilisé
 * par `BranchForm`, `PromotionForm`, `ServiceForm`, `CityForm` : un seul
 * composant partagé, jamais cinq blocs de formulaire recopiés par écran.
 * Chaque onglet affiche "✓"/"!" selon `completeness` (§16, même indicateur
 * que `TranslationStatusBadges`, calculé EN DIRECT depuis l'état du
 * formulaire par l'appelant — jamais une seconde définition de "complet").
 */
export function TranslationTabs({
  completeness,
  children,
}: {
  completeness: TranslationStatus;
  children: (locale: AppLocale) => React.ReactNode;
}) {
  return (
    <Tabs defaultValue="he" dir="ltr">
      <TabsList>
        {locales.map((locale) => (
          <TabsTrigger key={locale} value={locale}>
            {localeLabels[locale]} {completeness[locale] ? "✓" : "!"}
            {locale === "he" && <span className="text-destructive">*</span>}
          </TabsTrigger>
        ))}
      </TabsList>
      {locales.map((locale) => (
        <TabsContent key={locale} value={locale} dir={locale === "he" ? "rtl" : "ltr"}>
          {children(locale)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

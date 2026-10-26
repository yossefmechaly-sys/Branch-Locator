"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TranslationTabs } from "@/components/admin/TranslationTabs";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { translateAdminErrorMessage, translateAdminFieldErrors } from "@/lib/admin-i18n/errors";
import { computeTranslationStatus } from "@/lib/admin/translation-status";
import { locales, type AppLocale } from "@/types/i18n";

import { createCityAction, updateCityAction } from "@/app/admin/(dashboard)/cities/actions";

export interface CityFormValues {
  slug: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  sortOrder: number;
  translations: { locale: AppLocale; name: string }[];
}

export function emptyCityFormValues(): CityFormValues {
  return {
    slug: "",
    latitude: "",
    longitude: "",
    isActive: true,
    sortOrder: 0,
    translations: locales.map((locale) => ({ locale, name: "" })),
  };
}

export function CityForm({
  mode,
  cityId,
  initialVersion,
  initial,
}: {
  mode: "create" | "edit";
  cityId?: string;
  initialVersion?: number;
  initial?: CityFormValues;
}) {
  const resolvedInitial = initial ?? emptyCityFormValues();
  const router = useRouter();
  const { locale, dictionary } = useAdminI18n();
  const tAdmin = dictionary.cities;
  const [values, setValues] = useState(resolvedInitial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const completeness = useMemo(
    () => computeTranslationStatus(values.translations, (t) => t.name.trim().length > 0),
    [values.translations]
  );

  function updateTranslation(locale: AppLocale, value: string) {
    setValues((prev) => ({
      ...prev,
      translations: prev.translations.map((t) => (t.locale === locale ? { ...t, name: value } : t)),
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        slug: values.slug.trim(),
        latitude: values.latitude.trim() === "" ? null : Number(values.latitude),
        longitude: values.longitude.trim() === "" ? null : Number(values.longitude),
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        translations: values.translations
          .filter((t) => t.name.trim().length > 0)
          .map((t) => ({
            locale: t.locale,
            name: t.name.trim(),
          })),
      };
      const result =
        mode === "create" ? await createCityAction(payload) : await updateCityAction(cityId!, initialVersion!, payload);

      if (!result.success) {
        if (result.error.code === "VALIDATION") setFieldErrors(translateAdminFieldErrors(result.error.fieldErrors, locale));
        setError(translateAdminErrorMessage(result.error.message, locale));
        return;
      }

      router.push("/admin/cities");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      {error && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.identityAndCoordinates}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Phase 11, §16 (correctif défaut réel, audit accessibilité) :
              `htmlFor`/`id` ajoutés sur les 4 paires label/input ci-dessous —
              avant ce correctif, aucun lien programmatique n'existait entre
              elles (voir le commentaire détaillé sur `BranchForm.tsx#Field`,
              même défaut, ici corrigé directement puisque ce formulaire
              n'utilise pas de composant `Field` partagé). */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city-slug" className="text-sm font-medium">{tAdmin.slug}</label>
            <Input id="city-slug" dir="ltr" value={values.slug} onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))} required />
            {fieldErrors.slug && <p className="text-xs text-destructive">{fieldErrors.slug.join(" ")}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city-latitude" className="text-sm font-medium">{tAdmin.latitude}</label>
            <Input
              id="city-latitude"
              dir="ltr"
              inputMode="decimal"
              value={values.latitude}
              onChange={(e) => setValues((v) => ({ ...v, latitude: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city-longitude" className="text-sm font-medium">{tAdmin.longitude}</label>
            <Input
              id="city-longitude"
              dir="ltr"
              inputMode="decimal"
              value={values.longitude}
              onChange={(e) => setValues((v) => ({ ...v, longitude: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city-sort-order" className="text-sm font-medium">{tAdmin.sortOrder}</label>
            <Input
              id="city-sort-order"
              type="number"
              value={values.sortOrder}
              onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) || 0 }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.isActive} onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))} />
            {tAdmin.active}
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.translations}</CardTitle>
        </CardHeader>
        <CardContent>
          <TranslationTabs completeness={completeness}>
            {(locale) => {
              const t = values.translations.find((entry) => entry.locale === locale)!;
              return (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`city-name-${locale}`} className="text-sm font-medium">
                    {tAdmin.name} {locale === "he" && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    id={`city-name-${locale}`}
                    value={t.name}
                    onChange={(e) => updateTranslation(locale, e.target.value)}
                  />
                </div>
              );
            }}
          </TranslationTabs>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? tAdmin.saving : mode === "create" ? tAdmin.createCity : tAdmin.save}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/cities")}>
          {tAdmin.cancel}
        </Button>
      </div>
    </form>
  );
}

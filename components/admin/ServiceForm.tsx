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
import type { AppLocale } from "@/types/i18n";
import type { ServiceFormValues } from "@/lib/admin/service-form-values";

export type { ServiceFormValues } from "@/lib/admin/service-form-values";

import { createServiceAction, updateServiceAction } from "@/app/admin/(dashboard)/services/actions";


export function ServiceForm({
  mode,
  serviceId,
  initialVersion,
  initial,
}: {
  mode: "create" | "edit";
  serviceId?: string;
  initialVersion?: number;
  initial: ServiceFormValues;
}) {
  const router = useRouter();
  const { locale, dictionary } = useAdminI18n();
  const tAdmin = dictionary.services;
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const completeness = useMemo(
    () => computeTranslationStatus(values.translations, (t) => t.name.trim().length > 0),
    [values.translations]
  );

  function updateTranslation(locale: AppLocale, field: "name" | "description", value: string) {
    setValues((prev) => ({
      ...prev,
      translations: prev.translations.map((t) => (t.locale === locale ? { ...t, [field]: value } : t)),
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        slug: values.slug.trim(),
        icon: values.icon.trim(),
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        translations: values.translations.map((t) => ({
          locale: t.locale,
          name: t.name.trim(),
          description: t.description.trim() || null,
        })),
      };
      const result =
        mode === "create"
          ? await createServiceAction(payload)
          : await updateServiceAction(serviceId!, initialVersion!, payload);

      if (!result.success) {
        if (result.error.code === "VALIDATION") setFieldErrors(translateAdminFieldErrors(result.error.fieldErrors, locale));
        setError(translateAdminErrorMessage(result.error.message, locale));
        return;
      }

      router.push("/admin/services");
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
          <CardTitle>{tAdmin.identity}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Phase 11, §16 (correctif défaut réel, audit accessibilité) —
              même correctif que `CityForm.tsx`, voir son commentaire détaillé. */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="service-slug" className="text-sm font-medium">{tAdmin.slug}</label>
            <Input id="service-slug" dir="ltr" value={values.slug} onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))} required />
            {fieldErrors.slug && <p className="text-xs text-destructive">{fieldErrors.slug.join(" ")}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="service-icon" className="text-sm font-medium">{tAdmin.icon}</label>
            <Input id="service-icon" dir="ltr" value={values.icon} onChange={(e) => setValues((v) => ({ ...v, icon: e.target.value }))} placeholder="parking-circle" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="service-sort-order" className="text-sm font-medium">{tAdmin.sortOrder}</label>
            <Input
              id="service-sort-order"
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
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`service-name-${locale}`} className="text-sm font-medium">
                      {tAdmin.name} {locale === "he" && <span className="text-destructive">*</span>}
                    </label>
                    <Input
                      id={`service-name-${locale}`}
                      value={t.name}
                      onChange={(e) => updateTranslation(locale, "name", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`service-description-${locale}`} className="text-sm font-medium">
                      {tAdmin.description}
                    </label>
                    <textarea
                      id={`service-description-${locale}`}
                      className="min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      value={t.description}
                      onChange={(e) => updateTranslation(locale, "description", e.target.value)}
                    />
                  </div>
                </div>
              );
            }}
          </TranslationTabs>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? tAdmin.saving : mode === "create" ? tAdmin.createService : tAdmin.save}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/services")}>
          {tAdmin.cancel}
        </Button>
      </div>
    </form>
  );
}

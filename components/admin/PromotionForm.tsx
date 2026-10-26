"use client";

import { cloneElement, isValidElement, useId, useMemo, useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TranslationTabs } from "@/components/admin/TranslationTabs";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { translateAdminErrorMessage, translateAdminFieldErrors } from "@/lib/admin-i18n/errors";
import { PromotionPreview } from "@/components/admin/PromotionPreview";
import { computeTranslationStatus } from "@/lib/admin/translation-status";
import { decimalPriceStringSchema } from "@/lib/validators/common";
import type { AppLocale } from "@/types/i18n";
import type {
  PromotionFormValues,
  TranslationValues,
} from "@/lib/admin/promotion-form-values";

export type { PromotionFormValues } from "@/lib/admin/promotion-form-values";
import type { PromotionStatus, PromotionUnit } from "@/types/promotion";

import {
  createPromotionAction,
  updatePromotionAction,
  uploadPromotionImageAction,
} from "@/app/admin/(dashboard)/promotions/actions";

const STATUS_OPTIONS: PromotionStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "EXPIRED",
  "ARCHIVED",
];

const UNIT_OPTIONS: PromotionUnit[] = [
  "UNIT",
  "KG",
  "GRAM",
  "LITER",
  "ML",
  "PACK",
  "BOX",
];


function toPayload(values: PromotionFormValues) {
  return {
    slug: values.slug.trim(),
    image: values.image.trim() || null,
    price: values.price.trim() || null,
    originalPrice: values.originalPrice.trim() || null,
    currency: values.currency,
    unit: values.unit,
    startDate: values.startDate,
    endDate: values.endDate,
    url: values.url.trim() || null,
    status: values.status,
    appliesToAll: values.appliesToAll,
    branchIds: values.appliesToAll ? [] : values.branchIds,
    isFeatured: values.isFeatured,
    priority: values.priority,
    translations: values.translations.map((t) => ({
      locale: t.locale,
      productName: t.productName.trim() || null,
      title: t.title.trim(),
      description: t.description.trim() || null,
      ctaLabel: t.ctaLabel.trim() || null,
    })),
  };
}

export function PromotionForm({
  mode,
  promotionId,
  initialVersion,
  initial,
  branchOptions,
}: {
  mode: "create" | "edit";
  promotionId?: string;
  initialVersion?: number;
  initial: PromotionFormValues;
  branchOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { locale, dictionary } = useAdminI18n();
  const tAdmin = dictionary.promotions;
  const [values, setValues] = useState(initial);
  const [previewLocale, setPreviewLocale] = useState<"he" | "en">("he");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusLabels: Record<PromotionStatus, string> = {
    DRAFT: tAdmin.statuses.draft,
    SCHEDULED: tAdmin.statuses.scheduled,
    ACTIVE: tAdmin.statuses.active,
    EXPIRED: tAdmin.statuses.expired,
    ARCHIVED: tAdmin.statuses.archived,
  };

  const unitLabels: Record<PromotionUnit, string> = {
    UNIT: tAdmin.unitUnit,
    KG: tAdmin.unitKg,
    GRAM: tAdmin.unitGram,
    LITER: tAdmin.unitLiter,
    ML: tAdmin.unitMl,
    PACK: tAdmin.unitPack,
    BOX: tAdmin.unitBox,
  };

  const completeness = useMemo(
    () => computeTranslationStatus(values.translations, (t) => t.title.trim().length > 0),
    [values.translations]
  );

  const heTranslation = values.translations.find((t) => t.locale === "he")!;
  const previewPromotion = useMemo(() => {
    const t = values.translations.find((entry) => entry.locale === previewLocale) ?? heTranslation;
    return {
      id: promotionId ?? "preview",
      slug: values.slug || "preview",
      image: values.image || null,
      productName: t.productName || null,
      title: t.title || tAdmin.previewFallbackTitle,
      description: t.description || null,
      ctaLabel: t.ctaLabel || null,
      ctaUrl: values.url || null,
      startDate: values.startDate || "2026-01-01",
      endDate: values.endDate || "2026-01-01",
      price: decimalPriceStringSchema.safeParse(values.price).success
        ? values.price
        : null,
      originalPrice: decimalPriceStringSchema.safeParse(values.originalPrice).success
        ? values.originalPrice
        : null,
      currency: values.currency,
      unit: values.unit,
      isFeatured: values.isFeatured,
      priority: values.priority,
      isLocalToBranch: !values.appliesToAll,
    };
  }, [values, previewLocale, promotionId, heTranslation, tAdmin.previewFallbackTitle]);

  function updateTranslation(locale: AppLocale, field: keyof Omit<TranslationValues, "locale">, value: string) {
    setValues((prev) => ({
      ...prev,
      translations: prev.translations.map((t) => (t.locale === locale ? { ...t, [field]: value } : t)),
    }));
  }

  function toggleBranch(branchId: string) {
    setValues((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  }

  async function handleFileSelected(file: File) {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadPromotionImageAction(formData);

    setIsUploading(false);

    if (!result.success) {
      setError(translateAdminErrorMessage(result.error.message, locale));
      return;
    }

    setValues((v) => ({ ...v, image: result.data.url }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = toPayload(values);
      const result =
        mode === "create"
          ? await createPromotionAction(payload)
          : await updatePromotionAction(promotionId!, initialVersion!, payload);

      if (!result.success) {
        if (result.error.code === "VALIDATION") {
          setFieldErrors(translateAdminFieldErrors(result.error.fieldErrors, locale));
          setError(translateAdminErrorMessage(result.error.message, locale));
        } else {
          setError(translateAdminErrorMessage(result.error.message, locale));
        }
        return;
      }

      router.push("/admin/promotions");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {error && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin.identity}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Slug" error={fieldErrors.slug}>
              <Input dir="ltr"
                data-testid="promotion-slug"
                value={values.slug}
                onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))}
                placeholder="fresh-chicken-ramot"
                required
              />
            </Field>
            <Field label={tAdmin.imageUrl} error={fieldErrors.image}>
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileSelected(file);
                    e.target.value = "";
                  }}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? tAdmin.uploadingImage : tAdmin.uploadImage}
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    {tAdmin.imageFormatsHint}
                  </span>
                </div>

                {values.image && (
                  <div className="flex flex-col gap-2">
                    <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-md border bg-muted">
                      <NextImage
                        src={values.image}
                        alt=""
                        fill
                        className="object-contain"
                        unoptimized={values.image.startsWith("/uploads/")}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => setValues((v) => ({ ...v, image: "" }))}
                    >
                      {tAdmin.removeImage}
                    </Button>
                  </div>
                )}
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin.priceSection}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={tAdmin.price} error={fieldErrors.price} hint={tAdmin.priceHint}>
              <Input dir="ltr"
                data-testid="promotion-price"
                inputMode="decimal"
                value={values.price}
                onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
                placeholder="29.90"
              />
            </Field>
            <Field label={tAdmin.originalPrice} error={fieldErrors.originalPrice} hint={tAdmin.optional}>
              <Input dir="ltr"
                data-testid="promotion-original-price"
                inputMode="decimal"
                value={values.originalPrice}
                onChange={(e) => setValues((v) => ({ ...v, originalPrice: e.target.value }))}
                placeholder="39.90"
              />
            </Field>
            <Field label={tAdmin.currency}>
              <Select value={values.currency} onValueChange={() => undefined} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">ILS (₪)</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{tAdmin.currencyHint}</p>
            </Field>
            <Field label={tAdmin.unit}>
              <Select value={values.unit} onValueChange={(value) => setValues((v) => ({ ...v, unit: value as PromotionUnit }))}>
                <SelectTrigger className="w-full" data-testid="promotion-unit-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unitLabels[unit]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
                    <Field label={tAdmin.productName}>
                      <Input
                        data-testid={`promotion-productname-${locale}`}
                        value={t.productName}
                        onChange={(e) => updateTranslation(locale, "productName", e.target.value)}
                      />
                    </Field>
                    <Field label={tAdmin.translationTitle} required={locale === "he"}>
                      <Input
                        data-testid={`promotion-title-${locale}`}
                        value={t.title}
                        onChange={(e) => updateTranslation(locale, "title", e.target.value)}
                      />
                    </Field>
                    <Field label={tAdmin.description}>
                      <textarea
                        className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        value={t.description}
                        onChange={(e) => updateTranslation(locale, "description", e.target.value)}
                      />
                    </Field>
                    <Field label={tAdmin.ctaLabel}>
                      <Input
                        value={t.ctaLabel}
                        onChange={(e) => updateTranslation(locale, "ctaLabel", e.target.value)}
                      />
                    </Field>
                  </div>
                );
              }}
            </TranslationTabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin.scope}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  checked={values.appliesToAll}
                  onChange={() => setValues((v) => ({ ...v, appliesToAll: true, branchIds: [] }))}
                />
                {tAdmin.allBranches}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  checked={!values.appliesToAll}
                  onChange={() => setValues((v) => ({ ...v, appliesToAll: false }))}
                />
                {tAdmin.selectedBranches}
              </label>
            </div>

            {!values.appliesToAll && (
              <div className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                {branchOptions.map((branch) => (
                  <label key={branch.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={values.branchIds.includes(branch.id)}
                      onChange={() => toggleBranch(branch.id)}
                    />
                    {branch.label}
                  </label>
                ))}
              </div>
            )}
            {fieldErrors.branchIds && (
              <p className="text-sm text-destructive">{fieldErrors.branchIds.join(" ")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tAdmin.datesStatusFeatured}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={tAdmin.startDate} error={fieldErrors.startDate}>
              <Input dir="ltr"
                data-testid="promotion-start-date"
                type="date"
                value={values.startDate}
                onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
                required
              />
            </Field>
            <Field label={tAdmin.endDate} error={fieldErrors.endDate}>
              <Input dir="ltr"
                data-testid="promotion-end-date"
                type="date"
                value={values.endDate}
                onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
                required
              />
            </Field>
            <Field label={tAdmin.statusLabel}>
              <Select value={values.status} onValueChange={(value) => setValues((v) => ({ ...v, status: value as PromotionStatus }))}>
                <SelectTrigger className="w-full" data-testid="promotion-status-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={tAdmin.priorityLabel} hint={tAdmin.priorityHint}>
              <Input dir="ltr"
                data-testid="promotion-priority"
                type="number"
                value={values.priority}
                onChange={(e) => setValues((v) => ({ ...v, priority: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label={tAdmin.ctaUrl}>
              <Input dir="ltr" value={values.url} onChange={(e) => setValues((v) => ({ ...v, url: e.target.value }))} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input
                type="checkbox"
                checked={values.isFeatured}
                onChange={(e) => setValues((v) => ({ ...v, isFeatured: e.target.checked }))}
              />
              🔥 {tAdmin.featuredLabel}
            </label>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          {tAdmin.publicOrderingHint}
        </p>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? tAdmin.saving : mode === "create" ? tAdmin.createPromotion : tAdmin.save}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/promotions")}>
            {tAdmin.cancel}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">{tAdmin.preview}</h2>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant={previewLocale === "he" ? "default" : "outline"} onClick={() => setPreviewLocale("he")}>
              HE
            </Button>
            <Button type="button" size="sm" variant={previewLocale === "en" ? "default" : "outline"} onClick={() => setPreviewLocale("en")}>
              EN
            </Button>
          </div>
        </div>
        <PromotionPreview promotion={previewPromotion} locale={previewLocale} />
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string[];
  hint?: string;
  required?: boolean;
}) {
  // Phase 11, §16 (correctif défaut réel, audit accessibilité) — même
  // correctif que `BranchForm.tsx#Field`, voir le commentaire détaillé là-bas.
  const generatedId = useId();
  const child = isValidElement(children) ? (children as ReactElement<{ id?: string }>) : null;
  const controlId = child?.props.id ?? generatedId;
  const content = child ? cloneElement(child, child.props.id ? {} : { id: controlId }) : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {content}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error.join(" ")}</p>}
    </div>
  );
}

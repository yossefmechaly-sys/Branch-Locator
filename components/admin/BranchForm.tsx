"use client";

import { AdminLocationMap } from "@/components/admin/AdminLocationMap";
import { cloneElement, isValidElement, useId, useMemo, useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import NextImage from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TranslationTabs } from "@/components/admin/TranslationTabs";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { translateAdminErrorMessage, translateAdminFieldErrors } from "@/lib/admin-i18n/errors";
import { OpeningHoursEditor, emptyWeeklyOpeningHours } from "@/components/admin/OpeningHoursEditor";
import { SpecialOpeningHoursEditor, type SpecialHoursFormEntry } from "@/components/admin/SpecialOpeningHoursEditor";
import { ServiceSelector } from "@/components/admin/ServiceSelector";
import { computeTranslationStatus } from "@/lib/admin/translation-status";
import { locales, type AppLocale } from "@/types/i18n";
import type { OpeningHoursEntry } from "@/types/opening-hours";

import {
  createBranchAction,
  geocodeAddressAction,
  updateBranchAction,
  uploadBranchImageAction,
} from "@/app/admin/(dashboard)/branches/actions";

interface ImageFormEntry {
  clientId: string;
  imageUrl: string;
  alt: string;
  sortOrder: number;
}

export interface BranchFormValues {
  slug: string;
  branchCode: string;
  cityId: string;
  district: string;
  address: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  whatsappGroupUrl: string;
  wazeUrlOverride: string;
  mainImage: string;
  isActive: boolean;
  sortOrder: number;
  serviceIds: string[];
  openingHours: OpeningHoursEntry[];
  specialHours: SpecialHoursFormEntry[];
  images: ImageFormEntry[];
  translations: { locale: AppLocale; displayName: string; description: string; seoTitle: string; seoDescription: string }[];
}

export function emptyBranchFormValues(): BranchFormValues {
  return {
    slug: "",
    branchCode: "",
    cityId: "",
    district: "",
    address: "",
    postalCode: "",
    latitude: "",
    longitude: "",
    phone: "",
    email: "",
    whatsappNumber: "",
    whatsappGroupUrl: "",
    wazeUrlOverride: "",
    mainImage: "",
    isActive: true,
    sortOrder: 0,
    serviceIds: [],
    openingHours: emptyWeeklyOpeningHours(),
    specialHours: [],
    images: [],
    translations: locales.map((locale) => ({
      locale,
      displayName: "",
      description: "",
      seoTitle: "",
      seoDescription: "",
    })),
  };
}

function toPayload(values: BranchFormValues) {
  return {
    slug: values.slug.trim(),
    branchCode: values.branchCode.trim(),
    cityId: values.cityId,
    district: values.district.trim() || null,
    address: values.address.trim(),
    postalCode: values.postalCode.trim() || null,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    whatsappNumber: values.whatsappNumber.trim() || null,
    whatsappGroupUrl: values.whatsappGroupUrl.trim() || null,
    wazeUrlOverride: values.wazeUrlOverride.trim() || null,
    mainImage: values.mainImage.trim() || null,
    isActive: values.isActive,
    sortOrder: values.sortOrder,
    serviceIds: values.serviceIds,
    openingHours: values.openingHours,
    specialHours: values.specialHours.map((entry) => ({
      date: entry.date,
      title: entry.title.trim() || null,
      isClosed: entry.isClosed,
      openingTime: entry.isClosed ? null : entry.openingTime || null,
      closingTime: entry.isClosed ? null : entry.closingTime || null,
      openingTime2: entry.isClosed ? null : entry.openingTime2 || null,
      closingTime2: entry.isClosed ? null : entry.closingTime2 || null,
    })),
    images: values.images.map((image) => ({ imageUrl: image.imageUrl, alt: image.alt.trim() || null, sortOrder: image.sortOrder })),
    translations: values.translations
      .filter((t) => t.displayName.trim().length > 0)
      .map((t) => ({
        locale: t.locale,
        displayName: t.displayName.trim(),
        description: t.description.trim() || null,
        seoTitle: t.seoTitle.trim() || null,
        seoDescription: t.seoDescription.trim() || null,
      })),
  };
}

export function BranchForm({
  mode,
  branchId,
  initialVersion,
  initial,
  cityOptions,
  serviceOptions,
}: {
  mode: "create" | "edit";
  branchId?: string;
  initialVersion?: number;
  initial?: BranchFormValues;
  cityOptions: { id: string; label: string }[];
  serviceOptions: { id: string; label: string; icon: string; isActive: boolean }[];
}) {
  const resolvedInitial = initial ?? emptyBranchFormValues();
  const router = useRouter();
  const { locale, dictionary } = useAdminI18n();
  const tAdmin = dictionary.branches;
  const [values, setValues] = useState(resolvedInitial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmSlugChange, setConfirmSlugChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completeness = useMemo(
    () => computeTranslationStatus(values.translations, (t) => t.displayName.trim().length > 0),
    [values.translations]
  );

  const slugChanged =
  mode === "edit" &&
  initial !== undefined &&
  values.slug.trim() !== initial.slug;

  function updateTranslation(
    locale: AppLocale,
    field: "displayName" | "description" | "seoTitle" | "seoDescription",
    value: string
  ) {
    setValues((prev) => ({
      ...prev,
      translations: prev.translations.map((t) => (t.locale === locale ? { ...t, [field]: value } : t)),
    }));
  }

  async function handleGeocode() {
    if (!values.address.trim()) {
      setError(tAdmin.addressRequiredForGeocode);
      return;
    }
    setIsGeocoding(true);
    setError(null);
    const result = await geocodeAddressAction(values.address);
    setIsGeocoding(false);
    if (!result.success) {
      setError(translateAdminErrorMessage(result.error.message, locale));
      return;
    }
    setValues((v) => ({ ...v, latitude: String(result.data.latitude), longitude: String(result.data.longitude) }));
  }

  async function handleFileSelected(file: File) {
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadBranchImageAction(formData);
    setIsUploading(false);
    if (!result.success) {
      setError(translateAdminErrorMessage(result.error.message, locale));
      return;
    }
    setValues((v) => ({
      ...v,
      images: [...v.images, { clientId: crypto.randomUUID(), imageUrl: result.data.url, alt: "", sortOrder: v.images.length }],
    }));
  }

  function removeImage(clientId: string) {
    setValues((v) => ({ ...v, images: v.images.filter((image) => image.clientId !== clientId) }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = toPayload(values);
      const result =
        mode === "create"
          ? await createBranchAction(payload)
          : await updateBranchAction(branchId!, initialVersion!, payload);

      if (!result.success) {
        if (result.error.code === "VALIDATION") setFieldErrors(translateAdminFieldErrors(result.error.fieldErrors, locale));
        setError(translateAdminErrorMessage(result.error.message, locale));
        return;
      }

      router.push("/admin/branches");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.identity}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Slug" error={fieldErrors.slug}>
            <Input dir="ltr" value={values.slug} onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))} required />
          </Field>
          {slugChanged && (
            <div className="col-span-full rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              ⚠️ {tAdmin.slugChangeWarning}{" "}
              <code dir="ltr">/branches/{initial.slug}</code>
              <label className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={confirmSlugChange} onChange={(e) => setConfirmSlugChange(e.target.checked)} />
                {tAdmin.slugChangeConfirm}
              </label>
            </div>
          )}
          <Field label={tAdmin.branchCode} error={fieldErrors.branchCode}>
            <Input dir="ltr" value={values.branchCode} onChange={(e) => setValues((v) => ({ ...v, branchCode: e.target.value }))} required />
          </Field>
          <Field label={tAdmin.city} error={fieldErrors.cityId}>
            <Select value={values.cityId} onValueChange={(value) => setValues((v) => ({ ...v, cityId: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tAdmin.selectCity} />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={tAdmin.district}>
            <Input value={values.district} onChange={(e) => setValues((v) => ({ ...v, district: e.target.value }))} />
          </Field>
          <Field label={tAdmin.sortOrder} hint={tAdmin.sortOrderHint}>
            <Input
              type="number"
              value={values.sortOrder}
              onChange={(e) => setValues((v) => ({ ...v, sortOrder: Number(e.target.value) || 0 }))}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={values.isActive} onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))} />
            {tAdmin.active}
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.addressAndLocation}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={tAdmin.address} error={fieldErrors.address} className="lg:col-span-2">
            <Input value={values.address} onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))} required />
          </Field>
          <Field label={tAdmin.postalCode}>
            <Input dir="ltr" value={values.postalCode} onChange={(e) => setValues((v) => ({ ...v, postalCode: e.target.value }))} />
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={handleGeocode} disabled={isGeocoding}>
              {isGeocoding ? tAdmin.searching : tAdmin.searchAddress}
            </Button>
          </div>
          <Field label={tAdmin.latitude} error={fieldErrors.latitude}>
            <Input dir="ltr" inputMode="decimal" value={values.latitude} onChange={(e) => setValues((v) => ({ ...v, latitude: e.target.value }))} required />
          </Field>
          <Field label={tAdmin.longitude} error={fieldErrors.longitude}>
            <Input dir="ltr" inputMode="decimal" value={values.longitude} onChange={(e) => setValues((v) => ({ ...v, longitude: e.target.value }))} required />
          </Field>
          <p className="col-span-full text-xs text-muted-foreground">
{tAdmin.geocodeHint}
          </p>
          <div className="col-span-full">
            <AdminLocationMap
              latitude={values.latitude}
              longitude={values.longitude}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.contact}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={tAdmin.phone}>
            <Input dir="ltr" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
          </Field>
          <Field label={tAdmin.email}>
            <Input dir="ltr" type="email" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} />
          </Field>
          <Field label={tAdmin.whatsapp}>
            <Input dir="ltr" value={values.whatsappNumber} onChange={(e) => setValues((v) => ({ ...v, whatsappNumber: e.target.value }))} />
          </Field>
          <Field label={tAdmin.whatsappGroupUrl}>
            <Input dir="ltr" value={values.whatsappGroupUrl} onChange={(e) => setValues((v) => ({ ...v, whatsappGroupUrl: e.target.value }))} />
          </Field>
          <Field label={tAdmin.wazeUrl}>
            <Input dir="ltr" value={values.wazeUrlOverride} onChange={(e) => setValues((v) => ({ ...v, wazeUrlOverride: e.target.value }))} />
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
                  <Field label={tAdmin.displayName} required={locale === "he"}>
                    <Input
                      data-testid={`branch-displayname-${locale}`}
                      value={t.displayName}
                      onChange={(e) => updateTranslation(locale, "displayName", e.target.value)}
                    />
                  </Field>
                  <Field label={tAdmin.description}>
                    <textarea
                      data-testid={`branch-description-${locale}`}
                      className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      value={t.description}
                      onChange={(e) => updateTranslation(locale, "description", e.target.value)}
                    />
                  </Field>
                  <Field label={tAdmin.seoTitle}>
                    <Input
                      data-testid={`branch-seotitle-${locale}`}
                      value={t.seoTitle}
                      onChange={(e) => updateTranslation(locale, "seoTitle", e.target.value)}
                    />
                  </Field>
                  <Field label={tAdmin.seoDescription}>
                    <Input value={t.seoDescription} onChange={(e) => updateTranslation(locale, "seoDescription", e.target.value)} />
                  </Field>
                </div>
              );
            }}
          </TranslationTabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.weeklyHours}</CardTitle>
        </CardHeader>
        <CardContent>
          <OpeningHoursEditor value={values.openingHours} onChange={(openingHours) => setValues((v) => ({ ...v, openingHours }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.specialHours}</CardTitle>
        </CardHeader>
        <CardContent>
          <SpecialOpeningHoursEditor
            value={values.specialHours}
            onChange={(specialHours) => setValues((v) => ({ ...v, specialHours }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.servicesTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceSelector
            options={serviceOptions}
            selectedIds={values.serviceIds}
            onChange={(serviceIds) => setValues((v) => ({ ...v, serviceIds }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tAdmin.photos}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
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
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? tAdmin.uploading : tAdmin.uploadImage}
            </Button>
            <span className="text-xs text-muted-foreground">{tAdmin.imageFormatsHint}</span>
          </div>

          {values.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {values.images.map((image, index) => (
                <div key={image.clientId} className="flex flex-col gap-1.5 rounded-md border p-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded bg-muted">
                    <NextImage src={image.imageUrl} alt={image.alt || tAdmin.branchPhotoAlt} fill className="object-cover" unoptimized />
                  </div>
                  <Input
                    placeholder={tAdmin.altText}
                    value={image.alt}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        images: v.images.map((img) => (img.clientId === image.clientId ? { ...img, alt: e.target.value } : img)),
                      }))
                    }
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      size="sm"
                      variant={values.mainImage === image.imageUrl ? "default" : "outline"}
                      onClick={() => setValues((v) => ({ ...v, mainImage: image.imageUrl }))}
                    >
                      {values.mainImage === image.imageUrl ? tAdmin.mainImage : tAdmin.setMainImage}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeImage(image.clientId)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">{tAdmin.imageOrder} : {index + 1}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || (slugChanged && !confirmSlugChange)}>
          {isPending ? tAdmin.saving : mode === "create" ? tAdmin.createBranch : tAdmin.save}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/branches")}>
          {tAdmin.cancel}
        </Button>
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
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string[];
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  // Phase 11, §16 (correctif défaut réel, audit accessibilité) : avant ce
  // correctif, `<label>` n'était associé à AUCUN contrôle (ni `htmlFor` ni
  // `id` correspondant) — un lecteur d'écran ne pouvait pas annoncer le nom
  // du champ au focus, seule la proximité visuelle suggérait le lien. On
  // génère ici un `id` stable (`React.useId()`) et on l'injecte dans
  // l'unique enfant s'il ne déclare pas déjà le sien (`Input`/`textarea`
  // transmettent `id` nativement — cas de la grande majorité des champs de ce
  // formulaire). Pour un enfant composite comme `<Select>` (Radix), l'`id`
  // injecté sur la racine est inerte (aucune régression : c'est exactement
  // le comportement précédent) — l'association `htmlFor`/`id` reste alors un
  // gap connu pour ces champs-là, documenté séparément.
  const generatedId = useId();
  const child = isValidElement(children) ? (children as ReactElement<{ id?: string }>) : null;
  const controlId = child?.props.id ?? generatedId;
  const content = child ? cloneElement(child, child.props.id ? {} : { id: controlId }) : children;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
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

import { formatHoursCell, HOURS_COLUMN_KEYS } from "@/lib/import/hours-format";
import { locales } from "@/types/i18n";
import type { OpeningHoursEntry } from "@/types/opening-hours";

import type { ExportColumn } from "./table";

/**
 * Export magasins (Phase 10, §31) — MÊMES colonnes, MÊME ordre, MÊME syntaxe
 * d'horaires que `BRANCH_IMPORT_COLUMNS`/`lib/import/hours-format.ts` :
 * un fichier exporté puis réimporté sans modification doit produire un
 * `analyzeBranchImportRows` intégralement `action: "update"`, jamais une
 * divergence de format entre export et import (§31 : « identifiants stables
 * pour réimport »).
 */
export interface BranchExportRow {
  branchCode: string;
  slug: string;
  citySlug: string;
  district: string | null;
  address: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
  whatsappGroupUrl: string | null;
  wazeUrlOverride: string | null;
  isActive: boolean;
  sortOrder: number;
  serviceSlugs: string[];
  openingHours: OpeningHoursEntry[];
  translations: { locale: string; displayName: string }[];
}

function hoursByDay(openingHours: OpeningHoursEntry[]): Map<number, OpeningHoursEntry> {
  return new Map(openingHours.map((entry) => [entry.dayOfWeek, entry]));
}

export const BRANCH_EXPORT_COLUMNS: ExportColumn<BranchExportRow>[] = [
  { key: "branchCode", label: "branchCode", value: (r) => r.branchCode },
  { key: "slug", label: "slug", value: (r) => r.slug },
  { key: "citySlug", label: "citySlug", value: (r) => r.citySlug },
  { key: "district", label: "district", value: (r) => r.district ?? "" },
  { key: "address", label: "address", value: (r) => r.address },
  { key: "postalCode", label: "postalCode", value: (r) => r.postalCode ?? "" },
  { key: "latitude", label: "latitude", value: (r) => String(r.latitude) },
  { key: "longitude", label: "longitude", value: (r) => String(r.longitude) },
  { key: "phone", label: "phone", value: (r) => r.phone ?? "" },
  { key: "email", label: "email", value: (r) => r.email ?? "" },
  { key: "whatsappNumber", label: "whatsappNumber", value: (r) => r.whatsappNumber ?? "" },
  { key: "whatsappGroupUrl", label: "whatsappGroupUrl", value: (r) => r.whatsappGroupUrl ?? "" },
  { key: "wazeUrlOverride", label: "wazeUrlOverride", value: (r) => r.wazeUrlOverride ?? "" },
  { key: "isActive", label: "isActive", value: (r) => (r.isActive ? "vrai" : "faux") },
  { key: "sortOrder", label: "sortOrder", value: (r) => String(r.sortOrder) },
  { key: "serviceSlugs", label: "serviceSlugs", value: (r) => r.serviceSlugs.join(";") },
  ...HOURS_COLUMN_KEYS.map((key, dayOfWeek): ExportColumn<BranchExportRow> => ({
    key,
    label: key,
    value: (r) => {
      const entry = hoursByDay(r.openingHours).get(dayOfWeek);
      return entry ? formatHoursCell(entry) : "";
    },
  })),
  ...locales.map((locale): ExportColumn<BranchExportRow> => ({
    key: `displayName_${locale}`,
    label: `displayName_${locale}`,
    value: (r) => r.translations.find((t) => t.locale === locale)?.displayName ?? "",
  })),
];

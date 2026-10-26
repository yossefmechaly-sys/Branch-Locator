import ExcelJS from "exceljs";
import Papa from "papaparse";

import { unescapeCsvFormulaCell } from "@/lib/csv-cell-escaping";
import { branchInputSchema, type BranchInput } from "@/lib/validators/branch";
import { locales, type AppLocale } from "@/types/i18n";

import { HOURS_COLUMN_KEYS, parseWeeklyHours } from "./hours-format";

/**
 * Moteur d'import magasins CSV/XLSX (Phase 10, Partie D, §21-§29) — LE seul
 * moteur de validation, utilisé IDENTIQUEMENT par l'aperçu/dry-run (§25) et
 * par l'import réel (`services/admin/import.service.ts`) : ce fichier ne
 * touche jamais `prisma`, ne fait que fichier → lignes brutes → `BranchInput`
 * validé ou erreurs. Réutilise `branchInputSchema` (§27, Phase 9) — jamais un
 * second schéma d'import plus permissif.
 */

/** Sécurité upload (§36) — bornes volontairement généreuses pour un usage
 * réel (plusieurs centaines de magasins, §OBJECTIF) mais qui excluent un
 * fichier absurde/malveillant. */
export const IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const IMPORT_MAX_ROWS = 2000;
export const IMPORT_ALLOWED_EXTENSIONS = [".csv", ".xlsx"] as const;
export const IMPORT_ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel", // certains navigateurs envoient ce MIME pour un .csv
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream", // fallback fréquent, revalidé par l'extension ci-dessous
] as const;

/** Colonnes du template officiel (§23), DANS CET ORDRE — `serviceSlugs` est
 * une liste séparée par des POINTS-VIRGULES (jamais des virgules, réservées
 * au séparateur CSV et à la syntaxe des horaires) : ex. "kosher;parking".
 * `isActive` accepte "vrai"/"faux"/"true"/"false"/"1"/"0" (insensible à la
 * casse), vide = actif par défaut (même défaut que `branchInputSchema`). */
export const BRANCH_IMPORT_COLUMNS = [
  "branchCode",
  "slug",
  "citySlug",
  "district",
  "address",
  "postalCode",
  "latitude",
  "longitude",
  "phone",
  "email",
  "whatsappNumber",
  "whatsappGroupUrl",
  "wazeUrlOverride",
  "isActive",
  "sortOrder",
  "serviceSlugs",
  ...HOURS_COLUMN_KEYS,
  ...locales.map((locale) => `displayName_${locale}`),
] as const;

const REQUIRED_COLUMNS = ["branchCode", "slug", "citySlug", "address", "latitude", "longitude", "displayName_he"] as const;

export interface ParsedImportFile {
  rawRows: Record<string, string>[];
  headerKeys: string[];
}

export type ParseFileResult = { ok: true; file: ParsedImportFile } | { ok: false; error: string };

function stringifyCell(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    // Cellule formule (`{formula, result}`) ou date — on ne prend QUE la
    // valeur affichée/résultat, jamais la formule elle-même (§36 : une
    // formule importée n'est de toute façon jamais évaluée par ce parseur,
    // contrairement à un tableur — aucun risque d'exécution ici, mais on
    // évite quand même de stocker "[object Object]").
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if ("result" in value) return stringifyCell((value as { result: ExcelJS.CellValue }).result);
    if ("text" in value) return String((value as { text: unknown }).text);
    return "";
  }
  return String(value).trim();
}

/** Parse un fichier CSV ou XLSX déjà chargé en mémoire (§22 : les deux
 * formats minimum, `exceljs` côté serveur — jamais de dépendance à une
 * conversion Excel dans le navigateur pour la logique métier). */
export async function parseImportFile(buffer: Buffer, filename: string): Promise<ParseFileResult> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf-8");
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0) {
      return { ok: false, error: `Fichier CSV illisible : ${result.errors[0].message} (ligne ${result.errors[0].row ?? "?"})` };
    }
    if (result.data.length > IMPORT_MAX_ROWS) {
      return { ok: false, error: `Fichier trop volumineux : ${result.data.length} lignes (maximum ${IMPORT_MAX_ROWS})` };
    }
    const headerKeys = result.meta.fields ?? [];
    return { ok: true, file: { rawRows: result.data.map((row) => normalizeRawRow(row)), headerKeys } };
  }

  if (lower.endsWith(".xlsx")) {
    const workbook = new ExcelJS.Workbook();
    try {
      // `exceljs` embarque sa propre résolution de `@types/node` (via
      // `fast-csv`), incompatible structurellement avec le `Buffer` du
      // `@types/node` racine de ce projet (propriétés ArrayBuffer
      // redimensionnable récentes absentes de la version imbriquée) — un
      // désaccord de TYPES uniquement, le `Buffer` runtime est strictement le
      // même objet Node. Cast ciblé, documenté, jamais un `any` généralisé
      // ailleurs dans ce fichier.
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    } catch {
      return { ok: false, error: "Fichier XLSX illisible ou corrompu" };
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) return { ok: false, error: "Le classeur XLSX ne contient aucune feuille" };

    const headerRow = sheet.getRow(1);
    const headerKeys: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headerKeys[colNumber - 1] = stringifyCell(cell.value);
    });

    const rawRows: Record<string, string>[] = [];
    const rowCount = sheet.rowCount;
    if (rowCount - 1 > IMPORT_MAX_ROWS) {
      return { ok: false, error: `Fichier trop volumineux : ${rowCount - 1} lignes (maximum ${IMPORT_MAX_ROWS})` };
    }
    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      if (row.cellCount === 0) continue;
      const record: Record<string, string> = {};
      let hasValue = false;
      headerKeys.forEach((key, index) => {
        if (!key) return;
        const value = unescapeCsvFormulaCell(stringifyCell(row.getCell(index + 1).value));
        record[key] = value;
        if (value !== "") hasValue = true;
      });
      if (hasValue) rawRows.push(record);
    }
    return { ok: true, file: { rawRows, headerKeys: headerKeys.filter(Boolean) } };
  }

  return { ok: false, error: "Extension non supportée — utilisez un fichier .csv ou .xlsx" };
}

function normalizeRawRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const raw = typeof value === "string" ? value.trim() : String(value ?? "");
    normalized[key.trim()] = unescapeCsvFormulaCell(raw);
  }
  return normalized;
}

export interface BranchImportLookups {
  cityIdBySlug: ReadonlyMap<string, string>;
  serviceIdBySlug: ReadonlyMap<string, string>;
  /** Magasins existants indexés par `branchCode` ET par `slug` (§26 :
   * priorité `branchCode`, puis `slug` comme second identifiant stable —
   * JAMAIS un matching sur le nom affiché). */
  existingByBranchCode: ReadonlyMap<string, { id: string; slug: string }>;
  existingBySlug: ReadonlyMap<string, { id: string; branchCode: string }>;
}

export type ImportRowAction = "create" | "update" | "error" | "ignored";

export interface ImportRowResult {
  /** Numéro de ligne DANS LE FICHIER (1 = première ligne de données, après
   * l'en-tête) — affiché à l'utilisateur comme "ligne N". */
  rowNumber: number;
  action: ImportRowAction;
  branchCode: string;
  slug: string;
  displayName: string;
  matchedBranchId: string | null;
  data: BranchInput | null;
  errors: string[];
  warnings: string[];
}

export interface ImportAnalysisSummary {
  total: number;
  toCreate: number;
  toUpdate: number;
  errors: number;
  ignored: number;
  withWarnings: number;
}

export interface ImportAnalysis {
  rows: ImportRowResult[];
  summary: ImportAnalysisSummary;
}

function parseBoolean(raw: string | undefined, defaultValue: boolean): boolean {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "") return defaultValue;
  return ["1", "true", "vrai", "oui", "yes"].includes(value);
}

function parseServiceSlugs(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ligne entièrement vide (toutes les cellules vides) — ignorée, jamais
 * comptée en erreur (§24 : « lignes ignorées » est une catégorie distincte
 * des erreurs). */
function isBlankRow(row: Record<string, string>): boolean {
  return Object.values(row).every((value) => (value ?? "").trim() === "");
}

/**
 * Valide et transforme UNE ligne brute en `BranchInput` (ou erreurs). Fonction
 * pure hors résolution `lookups` (déjà chargée une fois par l'appelant,
 * jamais une requête par ligne, §8 même principe qu'analytics). C'est
 * EXACTEMENT cette fonction que `previewBranchImport` (dry-run) et
 * `executeBranchImport` (réel) appellent toutes les deux (§25).
 */
export function validateImportRow(
  row: Record<string, string>,
  rowNumber: number,
  lookups: BranchImportLookups,
  headerHasHoursColumns: boolean
): ImportRowResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const branchCode = (row.branchCode ?? "").trim();
  const slug = (row.slug ?? "").trim();
  const citySlug = (row.citySlug ?? "").trim();

  for (const column of REQUIRED_COLUMNS) {
    if (!(row[column] ?? "").trim()) errors.push(`Colonne obligatoire manquante : "${column}"`);
  }

  const cityId = citySlug ? lookups.cityIdBySlug.get(citySlug) : undefined;
  if (citySlug && !cityId) errors.push(`Ville inconnue : "${citySlug}" (slug non reconnu)`);

  const serviceSlugs = parseServiceSlugs(row.serviceSlugs);
  const serviceIds: string[] = [];
  for (const serviceSlug of serviceSlugs) {
    const serviceId = lookups.serviceIdBySlug.get(serviceSlug);
    if (!serviceId) errors.push(`Service inconnu : "${serviceSlug}" (slug non reconnu)`);
    else serviceIds.push(serviceId);
  }

  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (row.latitude && Number.isNaN(latitude)) errors.push(`Latitude invalide : "${row.latitude}"`);
  if (row.longitude && Number.isNaN(longitude)) errors.push(`Longitude invalide : "${row.longitude}"`);

  const sortOrderRaw = (row.sortOrder ?? "").trim();
  const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : 0;
  if (sortOrderRaw && !Number.isInteger(sortOrder)) errors.push(`Ordre invalide : "${row.sortOrder}"`);

  const hoursResult = parseWeeklyHours(row, headerHasHoursColumns);
  let openingHours: BranchInput["openingHours"] = [];
  if (!hoursResult.ok) {
    errors.push(...hoursResult.errors);
  } else if (hoursResult.entries) {
    openingHours = hoursResult.entries;
  }

  const translations = locales
    .map((locale) => ({ locale, displayName: (row[`displayName_${locale}`] ?? "").trim() }))
    .filter((t) => t.displayName.length > 0)
    .map((t) => ({
      locale: t.locale as AppLocale,
      displayName: t.displayName,
      description: null,
      seoTitle: null,
      seoDescription: null,
    }));

  const missingLocales = locales.filter((locale) => locale !== "he" && !translations.some((t) => t.locale === locale));
  if (missingLocales.length > 0) {
    warnings.push(`Traduction manquante pour : ${missingLocales.join(", ")}`);
  }

  // Correspondance (§26) : priorité ABSOLUE à `branchCode`, puis `slug` comme
  // second identifiant STABLE (jamais le nom affiché) — voir le commentaire
  // de tête de `BranchImportLookups`.
  const matchByCode = branchCode ? lookups.existingByBranchCode.get(branchCode) : undefined;
  const matchBySlug = slug ? lookups.existingBySlug.get(slug) : undefined;
  let matchedBranchId: string | null = null;
  if (matchByCode) {
    matchedBranchId = matchByCode.id;
    if (matchBySlug && matchBySlug.id !== matchByCode.id) {
      errors.push(
        `Conflit d'identifiants : le code magasin "${branchCode}" correspond à un magasin différent du slug "${slug}"`
      );
    }
  } else if (matchBySlug) {
    matchedBranchId = matchBySlug.id;
  }

  if (!(row.phone ?? "").trim() && !(row.whatsappNumber ?? "").trim()) {
    warnings.push("Aucun téléphone ni numéro WhatsApp renseigné");
  }
  if (headerHasHoursColumns && openingHours.length > 0 && openingHours.every((h) => h.isClosed)) {
    warnings.push("Horaires renseignés mais fermé tous les jours — vérifier qu'il ne s'agit pas d'un oubli");
  }
  if (!headerHasHoursColumns) {
    warnings.push("Aucune colonne d'horaires dans le fichier — les horaires existants ne seront pas modifiés");
  }

  const displayName = translations.find((t) => t.locale === "he")?.displayName ?? row.displayName_he ?? slug ?? branchCode;

  if (errors.length > 0) {
    return { rowNumber, action: "error", branchCode, slug, displayName, matchedBranchId, data: null, errors, warnings };
  }

  const candidate = {
    slug,
    branchCode,
    cityId: cityId!,
    district: (row.district ?? "").trim() || null,
    address: (row.address ?? "").trim(),
    postalCode: (row.postalCode ?? "").trim() || null,
    latitude,
    longitude,
    phone: (row.phone ?? "").trim() || null,
    email: (row.email ?? "").trim() || null,
    whatsappNumber: (row.whatsappNumber ?? "").trim() || null,
    whatsappGroupUrl: (row.whatsappGroupUrl ?? "").trim() || null,
    wazeUrlOverride: (row.wazeUrlOverride ?? "").trim() || null,
    mainImage: null,
    isActive: parseBoolean(row.isActive, true),
    sortOrder,
    serviceIds,
    openingHours,
    specialHours: [],
    images: [],
    translations,
  };

  // Revalidation via le MÊME schéma Zod que le formulaire admin (§27,
  // impératif) — jamais un import moins strict. Les erreurs Zod (ex. slug
  // mal formé, hébreu manquant après filtrage) rejoignent les erreurs
  // métier déjà collectées ci-dessus.
  const parsed = branchInputSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join(".") || "(ligne)"} : ${issue.message}`);
    }
    return { rowNumber, action: "error", branchCode, slug, displayName, matchedBranchId, data: null, errors, warnings };
  }

  return {
    rowNumber,
    action: matchedBranchId ? "update" : "create",
    branchCode,
    slug,
    displayName,
    matchedBranchId,
    data: parsed.data,
    errors: [],
    warnings,
  };
}

export function analyzeBranchImportRows(
  rawRows: Record<string, string>[],
  headerKeys: string[],
  lookups: BranchImportLookups
): ImportAnalysis {
  const headerHasHoursColumns = HOURS_COLUMN_KEYS.some((key) => headerKeys.includes(key));

  const results: ImportRowResult[] = [];
  const seenBranchCodes = new Map<string, number>();
  const seenSlugs = new Map<string, number>();

  let dataRowNumber = 0;
  for (const row of rawRows) {
    dataRowNumber += 1;
    if (isBlankRow(row)) {
      results.push({
        rowNumber: dataRowNumber,
        action: "ignored",
        branchCode: "",
        slug: "",
        displayName: "",
        matchedBranchId: null,
        data: null,
        errors: [],
        warnings: [],
      });
      continue;
    }

    const result = validateImportRow(row, dataRowNumber, lookups, headerHasHoursColumns);

    // Doublons DANS LE FICHIER (§24/§26) — un fichier qui référence deux fois
    // le même magasin ne doit jamais créer deux lignes en base.
    if (result.branchCode) {
      const firstSeen = seenBranchCodes.get(result.branchCode);
      if (firstSeen !== undefined) {
        result.errors.push(`Code magasin en doublon dans le fichier (déjà utilisé ligne ${firstSeen})`);
      } else {
        seenBranchCodes.set(result.branchCode, dataRowNumber);
      }
    }
    if (result.slug) {
      const firstSeen = seenSlugs.get(result.slug);
      if (firstSeen !== undefined) {
        result.errors.push(`Slug en doublon dans le fichier (déjà utilisé ligne ${firstSeen})`);
      } else {
        seenSlugs.set(result.slug, dataRowNumber);
      }
    }
    if (result.errors.length > 0 && result.action !== "error") {
      result.action = "error";
      result.data = null;
    }

    results.push(result);
  }

  const summary: ImportAnalysisSummary = {
    total: results.length,
    toCreate: results.filter((r) => r.action === "create").length,
    toUpdate: results.filter((r) => r.action === "update").length,
    errors: results.filter((r) => r.action === "error").length,
    ignored: results.filter((r) => r.action === "ignored").length,
    withWarnings: results.filter((r) => r.warnings.length > 0).length,
  };

  return { rows: results, summary };
}

/** Génère le contenu CSV du template officiel (§23) — une ligne d'en-tête +
 * une ligne d'exemple, encodage documenté dans `lib/import/README.md`. */
export function buildBranchImportTemplateCsv(): string {
  const example: Record<string, string> = {
    branchCode: "JLM-99",
    slug: "jerusalem-exemple",
    citySlug: "jerusalem",
    district: "",
    address: "Rehov Yafo 1",
    postalCode: "",
    latitude: "31.7683",
    longitude: "35.2137",
    phone: "+972-2-1234567",
    email: "",
    whatsappNumber: "+972501234567",
    whatsappGroupUrl: "",
    wazeUrlOverride: "",
    isActive: "vrai",
    sortOrder: "0",
    serviceSlugs: "kosher;parking",
    hours_dim: "09:00-19:00",
    hours_lun: "09:00-19:00",
    hours_mar: "09:00-19:00",
    hours_mer: "09:00-19:00",
    hours_jeu: "09:00-19:00",
    hours_ven: "09:00-14:00",
    hours_sam: "",
    displayName_he: "מעיין 2000 – ירושלים (דוגמה)",
    displayName_en: "Maayan 2000 – Jerusalem (example)",
    displayName_ru: "",
    displayName_fr: "",
    displayName_es: "",
  };

  return Papa.unparse({ fields: [...BRANCH_IMPORT_COLUMNS], data: [BRANCH_IMPORT_COLUMNS.map((col) => example[col] ?? "")] });
}

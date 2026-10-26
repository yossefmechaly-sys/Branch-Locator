import ExcelJS from "exceljs";
import Papa from "papaparse";

import { neutralizeCsvFormulaCell } from "@/lib/csv-cell-escaping";

/**
 * Rendu tableur partagé CSV/XLSX (Phase 10, Partie E) — UN SEUL endroit qui
 * sait transformer des lignes typées en fichier exportable, pour les trois
 * exports (magasins §31, promotions §33, analytics §32) : jamais trois
 * implémentations CSV et trois implémentations XLSX différentes. Chaque
 * colonne neutralise systématiquement l'injection de formule CSV (§36),
 * y compris côté XLSX (défense en profondeur, voir `lib/csv-cell-escaping.ts`).
 */
export interface ExportColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string;
}

export function buildExportRows<T>(columns: ExportColumn<T>[], rows: T[]): string[][] {
  return rows.map((row) => columns.map((column) => neutralizeCsvFormulaCell(column.value(row))));
}

/** Encodage UTF-8 explicite (§42 : accents, hébreu, russe doivent survivre à
 * l'export) — `Papa.unparse` produit déjà de l'UTF-8 pur ; le BOM est ajouté
 * pour qu'Excel Windows (qui devine sinon l'encodage sans BOM) affiche
 * correctement l'hébreu/le russe plutôt que du charabia. */
export function rowsToCsv<T>(columns: ExportColumn<T>[], rows: T[]): string {
  const csvBody = Papa.unparse({ fields: columns.map((c) => c.label), data: buildExportRows(columns, rows) });
  return `﻿${csvBody}`;
}

export interface ExportSheet<T> {
  name: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

/**
 * `buildXlsxWorkbook` accepte plusieurs feuilles de types de ligne
 * DIFFÉRENTS dans un même classeur (KPI, magasins, promotions, …) — un
 * tableau hétérogène que TypeScript ne peut pas typer précisément sans
 * variance contravariante sur `ExportColumn<T>.value`. `sheet()` est le SEUL
 * endroit qui efface ce type vers `unknown` (au lieu d'un `as any` répété à
 * chaque appel dans `export.service.ts`) — la sécurité de type reste
 * garantie à la CRÉATION de chaque feuille (le générique `T` est vérifié ici,
 * `columns`/`rows` doivent réellement correspondre), seule l'agrégation finale
 * dans le tableau `sheets` perd l'information de type, sans risque : `value()`
 * n'est jamais rappelée avec une ligne d'un mauvais type, `buildExportRows`
 * applique toujours LA MÊME liste de colonnes à SES PROPRES lignes.
 */
export function sheet<T>(name: string, columns: ExportColumn<T>[], rows: T[]): ExportSheet<unknown> {
  return { name, columns: columns as unknown as ExportColumn<unknown>[], rows: rows as unknown[] };
}

export async function buildXlsxWorkbook(sheets: ExportSheet<unknown>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    // Nom d'onglet Excel limité à 31 caractères, sans certains caractères
    // spéciaux — tronqué proprement plutôt que de laisser `exceljs` lever une
    // exception sur un nom trop long.
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31));
    worksheet.addRow(sheet.columns.map((c) => c.label));
    for (const row of buildExportRows(sheet.columns, sheet.rows)) worksheet.addRow(row);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}

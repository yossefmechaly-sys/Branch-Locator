import ExcelJS from "exceljs";
import Papa from "papaparse";
import { describe, expect, it } from "vitest";

import { buildXlsxWorkbook, rowsToCsv, sheet } from "@/lib/export/table";
import type { ExportColumn } from "@/lib/export/table";

interface FixtureRow {
  name: string;
  note: string;
}

const COLUMNS: ExportColumn<FixtureRow>[] = [
  { key: "name", label: "Nom", value: (r) => r.name },
  { key: "note", label: "Note", value: (r) => r.note },
];

/**
 * Rendu tableur partagé (Phase 10, §42) — couvre explicitement les cas
 * demandés par le cahier des charges : accents, hébreu, russe survivent à
 * l'export, et toute cellule dangereuse est neutralisée AVANT sérialisation
 * (§36), quel que soit le format (CSV ou XLSX).
 */
describe("rowsToCsv (Phase 10, §42)", () => {
  it("préserve les accents, l'hébreu et le russe", () => {
    const rows: FixtureRow[] = [
      { name: "Café à côté", note: "éàè" },
      { name: "מעיין 2000 – ירושלים", note: "עברית" },
      { name: "Магазин", note: "русский" },
    ];
    const csv = rowsToCsv(COLUMNS, rows);
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
    expect(parsed.data[0].Nom).toBe("Café à côté");
    expect(parsed.data[1].Nom).toBe("מעיין 2000 – ירושלים");
    expect(parsed.data[2].Nom).toBe("Магазин");
  });

  it("neutralise une cellule de formule dangereuse avant export (§36)", () => {
    const csv = rowsToCsv(COLUMNS, [{ name: "=cmd|'/c calc'!A1", note: "x" }]);
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
    expect(parsed.data[0].Nom.startsWith("'=")).toBe(true);
  });

  it("commence par un BOM UTF-8 (compatibilité Excel Windows pour l'hébreu/le russe)", () => {
    const csv = rowsToCsv(COLUMNS, [{ name: "מעיין", note: "" }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});

describe("buildXlsxWorkbook (Phase 10, §42)", () => {
  it("produit un classeur relisible avec plusieurs feuilles hétérogènes", async () => {
    interface OtherRow {
      count: number;
    }
    const otherColumns: ExportColumn<OtherRow>[] = [{ key: "count", label: "Compte", value: (r) => String(r.count) }];

    const buffer = await buildXlsxWorkbook([
      sheet("Fixture", COLUMNS, [{ name: "מעיין 2000", note: "Магазин" }]),
      sheet("Autre", otherColumns, [{ count: 42 }]),
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    expect(workbook.worksheets.map((s) => s.name)).toEqual(["Fixture", "Autre"]);
    expect(workbook.worksheets[0].getRow(2).getCell(1).value).toBe("מעיין 2000");
    expect(workbook.worksheets[0].getRow(2).getCell(2).value).toBe("Магазин");
    expect(workbook.worksheets[1].getRow(2).getCell(1).value).toBe("42");
  });

  it("neutralise aussi les cellules XLSX qui ressemblent à une formule", async () => {
    const buffer = await buildXlsxWorkbook([sheet("Fixture", COLUMNS, [{ name: "=1+1", note: "" }])]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const cell = workbook.worksheets[0].getRow(2).getCell(1).value;
    expect(String(cell).startsWith("'=")).toBe(true);
  });

  it("tronque un nom de feuille trop long (limite Excel 31 caractères)", async () => {
    const longName = "Un nom de feuille vraiment beaucoup trop long pour Excel";
    const buffer = await buildXlsxWorkbook([sheet(longName, COLUMNS, [])]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    expect(workbook.worksheets[0].name.length).toBeLessThanOrEqual(31);
  });
});

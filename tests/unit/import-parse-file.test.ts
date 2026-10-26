import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  BRANCH_IMPORT_COLUMNS,
  IMPORT_MAX_ROWS,
  buildBranchImportTemplateCsv,
  parseImportFile,
} from "@/lib/import/branch-import";

/**
 * `parseImportFile` (Phase 10, §22/§36/§41) — CSV et XLSX doivent produire
 * EXACTEMENT la même forme de ligne brute (`Record<string,string>`), c'est ce
 * qui garantit que `validateImportRow` se comporte identiquement quel que
 * soit le format d'origine (§22 : « pas de dépendance à une conversion Excel
 * navigateur pour la logique métier » — la logique vit ici, côté serveur,
 * pour les deux formats).
 */
describe("parseImportFile — CSV", () => {
  it("parse le template officiel généré par buildBranchImportTemplateCsv()", async () => {
    const csv = buildBranchImportTemplateCsv();
    const result = await parseImportFile(Buffer.from(csv, "utf-8"), "magasins.csv");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.rawRows).toHaveLength(1);
      expect(result.file.headerKeys).toEqual(expect.arrayContaining([...BRANCH_IMPORT_COLUMNS]));
      expect(result.file.rawRows[0].branchCode).toBe("JLM-99");
    }
  });

  it("rejette un fichier CSV dépassant IMPORT_MAX_ROWS (§36)", async () => {
    const header = [...BRANCH_IMPORT_COLUMNS].join(",");
    const blankRest = BRANCH_IMPORT_COLUMNS.length - 2;
    const rows = Array.from(
      { length: IMPORT_MAX_ROWS + 1 },
      (_, i) => `CODE-${i},slug-${i}${",".repeat(blankRest)}`
    );
    const csv = [header, ...rows].join("\n");
    const result = await parseImportFile(Buffer.from(csv, "utf-8"), "trop-gros.csv");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("volumineux");
  });

  it("ignore les lignes vides (skipEmptyLines)", async () => {
    const header = [...BRANCH_IMPORT_COLUMNS].join(",");
    const csv = `${header}\n\n\n`;
    const result = await parseImportFile(Buffer.from(csv, "utf-8"), "vide.csv");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.rawRows).toHaveLength(0);
  });
});

describe("parseImportFile — XLSX", () => {
  async function buildXlsxBuffer(rows: string[][]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Magasins");
    sheet.addRow([...BRANCH_IMPORT_COLUMNS]);
    for (const row of rows) sheet.addRow(row);
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }

  it("parse un classeur XLSX avec le même en-tête que le CSV", async () => {
    const exampleRow = BRANCH_IMPORT_COLUMNS.map((col) => (col === "branchCode" ? "XLS-01" : col === "slug" ? "test-xlsx" : ""));
    const buffer = await buildXlsxBuffer([exampleRow]);
    const result = await parseImportFile(buffer, "magasins.xlsx");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.rawRows).toHaveLength(1);
      expect(result.file.rawRows[0].branchCode).toBe("XLS-01");
      expect(result.file.rawRows[0].slug).toBe("test-xlsx");
    }
  });

  it("ignore une ligne entièrement vide", async () => {
    const blankRow = BRANCH_IMPORT_COLUMNS.map(() => "");
    const buffer = await buildXlsxBuffer([blankRow]);
    const result = await parseImportFile(buffer, "magasins.xlsx");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.rawRows).toHaveLength(0);
  });

  it("rejette un fichier XLSX corrompu proprement (jamais une exception non gérée)", async () => {
    const result = await parseImportFile(Buffer.from("ceci n'est pas un xlsx"), "corrompu.xlsx");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("corrompu");
  });
});

describe("parseImportFile — extension non supportée (§36)", () => {
  it("rejette un fichier .txt", async () => {
    const result = await parseImportFile(Buffer.from("contenu"), "fichier.txt");
    expect(result.ok).toBe(false);
  });
});

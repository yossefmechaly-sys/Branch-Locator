import { describe, expect, it } from "vitest";

import { BRANCH_EXPORT_COLUMNS, type BranchExportRow } from "@/lib/export/branch-export";
import { rowsToCsv } from "@/lib/export/table";
import {
  BRANCH_IMPORT_COLUMNS,
  analyzeBranchImportRows,
  parseImportFile,
  type BranchImportLookups,
} from "@/lib/import/branch-import";

/**
 * Export magasins ↔ import magasins (Phase 10, §31) — GARANTIE testée
 * explicitement : un fichier exporté doit être réimportable tel quel sans
 * modification, avec les MÊMES colonnes dans le MÊME ordre, et produire un
 * `action: "update"` sur le magasin dont il provient (jamais une divergence
 * de format qui romprait le cycle export → réimport).
 */
describe("BRANCH_EXPORT_COLUMNS ↔ BRANCH_IMPORT_COLUMNS (§31)", () => {
  it("exporte EXACTEMENT les mêmes clés de colonne, dans le même ordre, que le template d'import", () => {
    expect(BRANCH_EXPORT_COLUMNS.map((c) => c.key)).toEqual([...BRANCH_IMPORT_COLUMNS]);
  });
});

describe("Cycle export → réimport (§31)", () => {
  const exportedRow: BranchExportRow = {
    branchCode: "JLM-01",
    slug: "jerusalem-ramot",
    citySlug: "jerusalem",
    district: null,
    address: "Rehov Ramot 5",
    postalCode: null,
    latitude: 31.8,
    longitude: 35.2,
    phone: "+972-2-1111111",
    email: null,
    whatsappNumber: null,
    whatsappGroupUrl: null,
    wazeUrlOverride: null,
    isActive: true,
    sortOrder: 1,
    serviceSlugs: ["kosher"],
    openingHours: [
      { dayOfWeek: 0, isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null },
      { dayOfWeek: 1, isClosed: false, openingTime: "09:00", closingTime: "18:00", openingTime2: null, closingTime2: null },
      { dayOfWeek: 2, isClosed: false, openingTime: "09:00", closingTime: "18:00", openingTime2: null, closingTime2: null },
      { dayOfWeek: 3, isClosed: false, openingTime: "09:00", closingTime: "18:00", openingTime2: null, closingTime2: null },
      { dayOfWeek: 4, isClosed: false, openingTime: "09:00", closingTime: "18:00", openingTime2: null, closingTime2: null },
      { dayOfWeek: 5, isClosed: false, openingTime: "09:00", closingTime: "14:00", openingTime2: null, closingTime2: null },
      { dayOfWeek: 6, isClosed: true, openingTime: null, closingTime: null, openingTime2: null, closingTime2: null },
    ],
    translations: [{ locale: "he", displayName: "מעיין 2000 – ירושלים" }],
  };

  it("un magasin exporté puis réimporté correspond au MÊME magasin existant (action: update)", async () => {
    const csv = rowsToCsv(BRANCH_EXPORT_COLUMNS, [exportedRow]);
    const parsed = await parseImportFile(Buffer.from(csv, "utf-8"), "export.csv");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const lookups: BranchImportLookups = {
      cityIdBySlug: new Map([["jerusalem", "city-jlm"]]),
      serviceIdBySlug: new Map([["kosher", "svc-kosher"]]),
      existingByBranchCode: new Map([["JLM-01", { id: "branch-1", slug: "jerusalem-ramot" }]]),
      existingBySlug: new Map([["jerusalem-ramot", { id: "branch-1", branchCode: "JLM-01" }]]),
    };

    const analysis = analyzeBranchImportRows(parsed.file.rawRows, parsed.file.headerKeys, lookups);
    expect(analysis.rows).toHaveLength(1);
    expect(analysis.rows[0].action).toBe("update");
    expect(analysis.rows[0].matchedBranchId).toBe("branch-1");
    expect(analysis.rows[0].errors).toEqual([]);
    expect(analysis.rows[0].data?.openingHours).toHaveLength(7);
  });
});

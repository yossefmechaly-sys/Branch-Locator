import { describe, expect, it } from "vitest";

import {
  analyzeBranchImportRows,
  BRANCH_IMPORT_COLUMNS,
  buildBranchImportTemplateCsv,
  validateImportRow,
  type BranchImportLookups,
} from "@/lib/import/branch-import";

/**
 * Moteur de validation import magasins (Phase 10, §21-§29/§40). Ces tests
 * couvrent explicitement les exigences §41 : colonne manquante, type
 * invalide, doublon branchCode, slug dupliqué, horaire invalide, coordonnées
 * invalides, correspondance §26, et la garantie « même moteur en aperçu et en
 * import réel » (§25 : `analyzeBranchImportRows` est appelée identiquement
 * des deux côtés — testé une seule fois ici, réutilisé par
 * `services/admin/import.service.ts`).
 */
const LOOKUPS: BranchImportLookups = {
  cityIdBySlug: new Map([["jerusalem", "city-jlm"], ["netanya", "city-ntn"]]),
  serviceIdBySlug: new Map([["kosher", "svc-kosher"], ["parking", "svc-parking"]]),
  existingByBranchCode: new Map([["JLM-01", { id: "branch-existing-1", slug: "jerusalem-ramot" }]]),
  existingBySlug: new Map([["jerusalem-ramot", { id: "branch-existing-1", branchCode: "JLM-01" }]]),
};

function baseRow(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  return {
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
    whatsappNumber: "",
    whatsappGroupUrl: "",
    wazeUrlOverride: "",
    isActive: "vrai",
    sortOrder: "0",
    serviceSlugs: "kosher;parking",
    displayName_he: "מעיין 2000 – ירושלים",
    displayName_en: "",
    displayName_ru: "",
    displayName_fr: "",
    displayName_es: "",
    ...overrides,
  };
}

describe("validateImportRow — cas nominal (§27 : réutilise branchInputSchema)", () => {
  it("valide une ligne complète et correcte comme 'create' (nouveau branchCode/slug)", () => {
    const result = validateImportRow(baseRow(), 1, LOOKUPS, false);
    expect(result.action).toBe("create");
    expect(result.errors).toEqual([]);
    expect(result.data?.branchCode).toBe("JLM-99");
    expect(result.data?.serviceIds).toEqual(["svc-kosher", "svc-parking"]);
  });
});

describe("validateImportRow — colonnes obligatoires manquantes (§40/§41)", () => {
  it("rejette une ligne sans branchCode", () => {
    const result = validateImportRow(baseRow({ branchCode: "" }), 1, LOOKUPS, false);
    expect(result.action).toBe("error");
    expect(result.errors.some((e) => e.includes("branchCode"))).toBe(true);
  });

  it("rejette une ligne sans displayName_he (hébreu obligatoire, §4 Phase 9)", () => {
    const result = validateImportRow(baseRow({ displayName_he: "" }), 1, LOOKUPS, false);
    expect(result.action).toBe("error");
    expect(result.errors.some((e) => e.toLowerCase().includes("displayname_he") || e.toLowerCase().includes("hébreu"))).toBe(true);
  });
});

describe("validateImportRow — types invalides (§41)", () => {
  it("rejette une latitude non numérique", () => {
    const result = validateImportRow(baseRow({ latitude: "pas-un-nombre" }), 1, LOOKUPS, false);
    expect(result.action).toBe("error");
    expect(result.errors.some((e) => e.includes("Latitude"))).toBe(true);
  });

  it("rejette une longitude hors bornes via le schéma Zod réutilisé (§27)", () => {
    const result = validateImportRow(baseRow({ longitude: "999" }), 1, LOOKUPS, false);
    expect(result.action).toBe("error");
  });

  it("rejette un ordre de tri non entier", () => {
    const result = validateImportRow(baseRow({ sortOrder: "1.5" }), 1, LOOKUPS, false);
    expect(result.action).toBe("error");
  });
});

describe("validateImportRow — résolution ville/services (§21-§23)", () => {
  it("rejette un citySlug inconnu", () => {
    const result = validateImportRow(baseRow({ citySlug: "atlantide" }), 1, LOOKUPS, false);
    expect(result.action).toBe("error");
    expect(result.errors.some((e) => e.includes("Ville inconnue"))).toBe(true);
  });

  it("rejette un service inconnu dans la liste", () => {
    const result = validateImportRow(baseRow({ serviceSlugs: "kosher;teleportation" }), 1, LOOKUPS, false);
    expect(result.action).toBe("error");
    expect(result.errors.some((e) => e.includes("Service inconnu"))).toBe(true);
  });
});

describe("validateImportRow — horaires (§29)", () => {
  it("rejette un horaire mal formé quand l'en-tête déclare des colonnes d'horaires", () => {
    const result = validateImportRow(baseRow({ hours_dim: "invalide" }), 1, LOOKUPS, true);
    expect(result.action).toBe("error");
  });

  it("accepte des horaires valides et les propage dans data.openingHours", () => {
    const result = validateImportRow(
      baseRow({ hours_dim: "", hours_lun: "09:00-18:00", hours_mar: "", hours_mer: "", hours_jeu: "", hours_ven: "", hours_sam: "" }),
      1,
      LOOKUPS,
      true
    );
    expect(result.action).toBe("create");
    expect(result.data?.openingHours).toHaveLength(7);
  });
});

describe("validateImportRow — correspondance magasin existant (§26)", () => {
  it("priorité au branchCode : correspondance = 'update' sur l'id existant", () => {
    const result = validateImportRow(baseRow({ branchCode: "JLM-01", slug: "jerusalem-ramot" }), 1, LOOKUPS, false);
    expect(result.action).toBe("update");
    expect(result.matchedBranchId).toBe("branch-existing-1");
  });

  it("à défaut de branchCode connu, correspondance par slug", () => {
    const result = validateImportRow(baseRow({ branchCode: "NEW-CODE", slug: "jerusalem-ramot" }), 1, LOOKUPS, false);
    expect(result.action).toBe("update");
    expect(result.matchedBranchId).toBe("branch-existing-1");
  });

  it("branchCode et slug pointant vers deux magasins DIFFÉRENTS → erreur de conflit, jamais un matching sur le nom", () => {
    const lookups: BranchImportLookups = {
      ...LOOKUPS,
      existingBySlug: new Map([
        ...LOOKUPS.existingBySlug,
        ["autre-magasin", { id: "branch-existing-2", branchCode: "OTHER" }],
      ]),
    };
    const result = validateImportRow(baseRow({ branchCode: "JLM-01", slug: "autre-magasin" }), 1, lookups, false);
    expect(result.action).toBe("error");
    expect(result.errors.some((e) => e.includes("Conflit"))).toBe(true);
  });
});

describe("validateImportRow — avertissements non bloquants (§24/§34)", () => {
  it("avertit sans bloquer quand ni téléphone ni WhatsApp ne sont renseignés", () => {
    const result = validateImportRow(baseRow({ phone: "", whatsappNumber: "" }), 1, LOOKUPS, false);
    expect(result.action).toBe("create");
    expect(result.warnings.some((w) => w.toLowerCase().includes("téléphone"))).toBe(true);
  });

  it("avertit quand une traduction non-hébreu est absente", () => {
    const result = validateImportRow(baseRow({ displayName_en: "" }), 1, LOOKUPS, false);
    expect(result.warnings.some((w) => w.includes("en"))).toBe(true);
  });
});

describe("analyzeBranchImportRows — doublons DANS LE FICHIER (§24/§26)", () => {
  it("détecte un branchCode dupliqué entre deux lignes du même fichier", () => {
    const rows = [baseRow({ slug: "a" }), baseRow({ slug: "b" })]; // même branchCode JLM-99
    const analysis = analyzeBranchImportRows(rows, [...BRANCH_IMPORT_COLUMNS], LOOKUPS);
    expect(analysis.rows[1].action).toBe("error");
    expect(analysis.rows[1].errors.some((e) => e.includes("doublon"))).toBe(true);
  });

  it("détecte un slug dupliqué entre deux lignes du même fichier", () => {
    const rows = [baseRow({ branchCode: "A" }), baseRow({ branchCode: "B" })]; // même slug
    const analysis = analyzeBranchImportRows(rows, [...BRANCH_IMPORT_COLUMNS], LOOKUPS);
    expect(analysis.rows[1].action).toBe("error");
    expect(analysis.rows[1].errors.some((e) => e.includes("doublon"))).toBe(true);
  });

  it("ignore une ligne entièrement vide sans la compter en erreur (§24 : catégorie distincte)", () => {
    const blank: Record<string, string> = Object.fromEntries(BRANCH_IMPORT_COLUMNS.map((c) => [c, ""]));
    const analysis = analyzeBranchImportRows([baseRow(), blank], [...BRANCH_IMPORT_COLUMNS], LOOKUPS);
    expect(analysis.rows[1].action).toBe("ignored");
    expect(analysis.summary.ignored).toBe(1);
    expect(analysis.summary.errors).toBe(0);
  });

  it("le résumé compte correctement create/update/error/ignored", () => {
    const rows = [
      baseRow({ slug: "new-1" }),
      baseRow({ branchCode: "JLM-01", slug: "jerusalem-ramot" }),
      baseRow({ slug: "" }), // erreur : slug manquant
    ];
    const analysis = analyzeBranchImportRows(rows, [...BRANCH_IMPORT_COLUMNS], LOOKUPS);
    expect(analysis.summary.total).toBe(3);
    expect(analysis.summary.toCreate).toBe(1);
    expect(analysis.summary.toUpdate).toBe(1);
    expect(analysis.summary.errors).toBe(1);
  });
});

describe("buildBranchImportTemplateCsv (§23 : template officiel)", () => {
  it("produit un CSV avec l'en-tête BRANCH_IMPORT_COLUMNS et une ligne d'exemple", () => {
    const csv = buildBranchImportTemplateCsv();
    const [headerLine] = csv.split("\n");
    for (const column of BRANCH_IMPORT_COLUMNS) {
      expect(headerLine).toContain(column);
    }
  });
});

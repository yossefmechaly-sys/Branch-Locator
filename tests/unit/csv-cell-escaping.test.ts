import { describe, expect, it } from "vitest";

import { neutralizeCsvFormulaCell, unescapeCsvFormulaCell } from "@/lib/csv-cell-escaping";

/**
 * Neutralisation CSV Formula Injection (Phase 10, §36/§42) — chaque cellule
 * commençant par `=`, `+`, `-` ou `@` doit être préfixée d'une apostrophe
 * pour qu'un tableur l'affiche comme texte, jamais comme une formule.
 */
describe("neutralizeCsvFormulaCell (Phase 10, §36)", () => {
  it("neutralise une formule commençant par '='", () => {
    expect(neutralizeCsvFormulaCell("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
  });

  it("neutralise '+', '-' et '@' en tête de cellule", () => {
    expect(neutralizeCsvFormulaCell("+1+1")).toBe("'+1+1");
    expect(neutralizeCsvFormulaCell("-1+1")).toBe("'-1+1");
    expect(neutralizeCsvFormulaCell("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
  });

  it("neutralise un préfixe tabulation/retour chariot (variantes moins connues)", () => {
    expect(neutralizeCsvFormulaCell("\t=1+1")).toBe("'\t=1+1");
  });

  it("laisse une valeur normale intacte", () => {
    expect(neutralizeCsvFormulaCell("Maayan 2000 – Ramot")).toBe("Maayan 2000 – Ramot");
    expect(neutralizeCsvFormulaCell("")).toBe("");
    expect(neutralizeCsvFormulaCell("+972-2-1234567".slice(5))).toBe("2-1234567");
  });

  it("ne neutralise PAS une valeur qui contient = ailleurs qu'en tête", () => {
    expect(neutralizeCsvFormulaCell("prix=29.90")).toBe("prix=29.90");
  });
});

/**
 * `unescapeCsvFormulaCell` (Phase 10, §31) — l'inverse EXACT, appliqué par le
 * parseur d'import, garantit qu'un numéro de téléphone "+972…" (ou toute
 * autre valeur légitime commençant par un caractère neutralisé) survive
 * intact à un cycle export → réimport (voir `tests/unit/export-branch.test.ts`
 * pour le test de bout en bout).
 */
describe("unescapeCsvFormulaCell — inverse exact de neutralizeCsvFormulaCell (§31)", () => {
  it("retire l'apostrophe ajoutée par neutralizeCsvFormulaCell, pour chaque préfixe dangereux", () => {
    for (const original of ["=1+1", "+972-2-1234567", "-5", "@handle", "\t=1"]) {
      expect(unescapeCsvFormulaCell(neutralizeCsvFormulaCell(original))).toBe(original);
    }
  });

  it("laisse intacte une valeur qui ne commence pas par une apostrophe", () => {
    expect(unescapeCsvFormulaCell("+972-2-1234567")).toBe("+972-2-1234567");
  });

  it("laisse intacte une apostrophe qui n'est pas suivie d'un préfixe dangereux (jamais une sur-correction)", () => {
    expect(unescapeCsvFormulaCell("'tis a normal value")).toBe("'tis a normal value");
  });
});

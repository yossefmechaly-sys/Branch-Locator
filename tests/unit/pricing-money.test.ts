import { describe, expect, it } from "vitest";

import { centsToDecimalString, decimalStringToCents, formatMoney } from "@/lib/pricing/money";

describe("decimalStringToCents (Phase 9, §2 : jamais de float)", () => {
  it("convertit une chaîne décimale à 2 décimales en centimes entiers", () => {
    expect(decimalStringToCents("29.90")).toBe(2990);
    expect(decimalStringToCents("9.90")).toBe(990);
    expect(decimalStringToCents("150.00")).toBe(15000);
  });

  it("complète une seule décimale (ex. '29.9') à deux chiffres", () => {
    expect(decimalStringToCents("29.9")).toBe(2990);
  });

  it("accepte un entier sans partie décimale", () => {
    expect(decimalStringToCents("150")).toBe(15000);
  });

  it("évite l'imprécision binaire classique (0.1 + 0.2 !== 0.3 en float)", () => {
    // 19.90 en float vaut souvent 1989.9999999999998 * 100 arrondi — ici,
    // aucune multiplication flottante n'intervient : le résultat est exact.
    expect(decimalStringToCents("19.90")).toBe(1990);
    expect(decimalStringToCents("0.10")).toBe(10);
    expect(decimalStringToCents("0.20")).toBe(20);
  });

  it("rejette une chaîne avec plus de 2 décimales, négative, ou non numérique", () => {
    expect(() => decimalStringToCents("29.999")).toThrow();
    expect(() => decimalStringToCents("-5.00")).toThrow();
    expect(() => decimalStringToCents("abc")).toThrow();
    expect(() => decimalStringToCents("")).toThrow();
  });
});

describe("centsToDecimalString (conversion inverse)", () => {
  it("reconstruit la chaîne décimale d'origine", () => {
    expect(centsToDecimalString(2990)).toBe("29.90");
    expect(centsToDecimalString(10)).toBe("0.10");
    expect(centsToDecimalString(15000)).toBe("150.00");
  });

  it("rejette un nombre non entier ou négatif", () => {
    expect(() => centsToDecimalString(29.5)).toThrow();
    expect(() => centsToDecimalString(-100)).toThrow();
  });

  it("round-trip avec decimalStringToCents pour un ensemble de valeurs", () => {
    for (const value of ["0.00", "1.00", "9.90", "29.90", "150.00", "1999.99"]) {
      expect(centsToDecimalString(decimalStringToCents(value))).toBe(value);
    }
  });
});

describe("formatMoney (Phase 9, §3 : jamais de symbole codé en dur)", () => {
  it("formate en ILS selon chaque locale via Intl.NumberFormat, jamais un ₪ codé en dur", () => {
    // On vérifie le comportement observable (présence des chiffres attendus,
    // et présence d'UN symbole/code monétaire — peu importe lequel, c'est
    // `Intl.NumberFormat` qui décide) plutôt qu'une chaîne exacte fragile
    // d'une version d'ICU à l'autre. Le point important : cette fonction ne
    // contient elle-même aucun symbole codé en dur — voir le code source de
    // `lib/pricing/money.ts#formatMoney()`, qui ne fait que déléguer à `Intl`.
    const he = formatMoney(2990, "ILS", "he");
    const en = formatMoney(2990, "ILS", "en");
    const fr = formatMoney(2990, "ILS", "fr");

    expect(he).toContain("29.90");
    expect(en).toContain("29.90");
    expect(fr).toMatch(/29[,.]90/);

    // Un symbole/code monétaire est bien présent (₪ ou "ILS" selon
    // l'environnement ICU) — jamais juste le nombre nu.
    expect(he).toMatch(/[₪]|ILS/);
    expect(en).toMatch(/[₪]|ILS/);
  });

  it("conserve toujours 2 décimales, même pour un montant rond", () => {
    expect(formatMoney(15000, "ILS", "en")).toContain("150.00");
  });
});

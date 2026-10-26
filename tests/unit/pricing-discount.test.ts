import { describe, expect, it } from "vitest";

import { computeDiscount } from "@/lib/pricing/discount";
import { decimalStringToCents } from "@/lib/pricing/money";

describe("computeDiscount (Phase 9, §5/§6)", () => {
  it("calcule le montant économisé et le pourcentage arrondi, exemple du cahier des charges (39.90 → 29.90 ≈ 25%)", () => {
    const priceCents = decimalStringToCents("29.90");
    const originalPriceCents = decimalStringToCents("39.90");

    const result = computeDiscount(priceCents, originalPriceCents);

    expect(result).not.toBeNull();
    expect(result?.amountCents).toBe(1000); // 10.00 ILS économisés
    expect(result?.percentage).toBe(25);
  });

  it("retourne null quand originalPrice est absent — jamais de réduction inventée (§5)", () => {
    const priceCents = decimalStringToCents("29.90");
    expect(computeDiscount(priceCents, null)).toBeNull();
  });

  it("retourne null quand originalPrice est inférieur ou égal au prix (donnée incohérente ou prix inchangé)", () => {
    const priceCents = decimalStringToCents("29.90");
    expect(computeDiscount(priceCents, decimalStringToCents("29.90"))).toBeNull();
    expect(computeDiscount(priceCents, decimalStringToCents("20.00"))).toBeNull();
  });

  it("arrondit le pourcentage à l'entier le plus proche", () => {
    // 10.00 → 9.90 : 1% de réduction, mais 0.01/0.10 * 100 tombe pile sur 1%.
    const result = computeDiscount(decimalStringToCents("9.90"), decimalStringToCents("10.00"));
    expect(result?.percentage).toBe(1);
  });

  it("le montant économisé reste une arithmétique entière exacte sur les centimes", () => {
    // 12.90 → 9.90 = 3.00 exactement, jamais 2.9999999999999996 (imprécision float).
    const result = computeDiscount(decimalStringToCents("9.90"), decimalStringToCents("12.90"));
    expect(result?.amountCents).toBe(300);
  });
});

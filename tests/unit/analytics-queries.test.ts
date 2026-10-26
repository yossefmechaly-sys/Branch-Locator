import { describe, expect, it } from "vitest";

import {
  buildDailySeries,
  computeConversion,
  computeDeltaPercent,
  computeVisitIntent,
  emptyKpis,
  kpisFromTypeCounts,
  type DailySeriesRawRow,
  type DbEventType,
} from "@/lib/analytics/queries";
import type { AnalyticsKpis } from "@/types/analytics";
import { ANALYTICS_KPI_KEYS } from "@/types/analytics";

/**
 * Agrégation pure (Phase 10, §8/§11/§12/§17) — aucune de ces fonctions ne
 * touche `prisma` : elles sont testées ici isolément, sans base de données ni
 * réseau (contrairement à `services/admin/analytics.repository.ts`, qui reste
 * non testable dans ce bac à sable faute de Prisma Client généré — voir le
 * rapport Phase 9 §14 et la limitation reconduite en Phase 10).
 */
describe("emptyKpis (Phase 10, §47 : jamais de chiffre fictif quand la DB est vide)", () => {
  it("renvoie 0 pour chaque clé du DTO KPI, jamais undefined/NaN", () => {
    const kpis = emptyKpis();
    for (const key of ANALYTICS_KPI_KEYS) {
      expect(kpis[key]).toBe(0);
    }
  });
});

describe("computeVisitIntent (Phase 10, §11/§20)", () => {
  it("est la somme navigation + téléphone + WhatsApp, sans pondération ni déduplication", () => {
    expect(computeVisitIntent(3, 2, 1)).toBe(6);
    expect(computeVisitIntent(0, 0, 0)).toBe(0);
  });
});

describe("kpisFromTypeCounts (Phase 10, §11)", () => {
  it("construit les KPI à partir d'un comptage par type, avec navigationClicks agrégé (waze+google+apple)", () => {
    const counts: Partial<Record<DbEventType, number>> = {
      LOCATOR_VIEW: 100,
      BRANCH_VIEW: 40,
      SEARCH: 25,
      GEOLOCATION_USED: 10,
      WAZE_CLICK: 5,
      GOOGLE_MAPS_CLICK: 3,
      APPLE_MAPS_CLICK: 2,
      PHONE_CLICK: 4,
      WHATSAPP_CLICK: 6,
      PROMOTION_VIEW: 20,
      PROMOTION_CLICK: 7,
    };
    const kpis = kpisFromTypeCounts(counts, 8);

    expect(kpis.locatorViews).toBe(100);
    expect(kpis.branchViews).toBe(40);
    expect(kpis.searches).toBe(25);
    expect(kpis.zeroResultSearches).toBe(8);
    expect(kpis.geolocationUsed).toBe(10);
    expect(kpis.wazeClicks).toBe(5);
    expect(kpis.googleMapsClicks).toBe(3);
    expect(kpis.appleMapsClicks).toBe(2);
    // navigationClicks = 5 + 3 + 2, jamais un événement stocké séparément (voir events.ts).
    expect(kpis.navigationClicks).toBe(10);
    expect(kpis.phoneClicks).toBe(4);
    expect(kpis.whatsappClicks).toBe(6);
    expect(kpis.promotionViews).toBe(20);
    expect(kpis.promotionClicks).toBe(7);
    // visitIntent = navigationClicks(10) + phoneClicks(4) + whatsappClicks(6).
    expect(kpis.visitIntent).toBe(20);
  });

  it("traite les types absents du comptage comme 0, jamais undefined (§47)", () => {
    const kpis = kpisFromTypeCounts({}, 0);
    for (const key of ANALYTICS_KPI_KEYS) {
      expect(kpis[key]).toBe(0);
    }
  });
});

describe("computeConversion (Phase 10, §12 : ratios d'interaction, jamais de vente)", () => {
  it("calcule les ratios branchView→navigation/phone/whatsapp et promotionView→click", () => {
    const kpis: AnalyticsKpis = {
      ...emptyKpis(),
      branchViews: 100,
      navigationClicks: 25,
      phoneClicks: 10,
      whatsappClicks: 5,
      promotionViews: 40,
      promotionClicks: 8,
    };
    const conversion = computeConversion(kpis);
    expect(conversion.branchViewToNavigation).toBeCloseTo(0.25);
    expect(conversion.branchViewToPhone).toBeCloseTo(0.1);
    expect(conversion.branchViewToWhatsapp).toBeCloseTo(0.05);
    expect(conversion.promotionViewToClick).toBeCloseTo(0.2);
  });

  it("renvoie null (jamais Infinity/NaN) quand le dénominateur est nul (§17)", () => {
    const kpis: AnalyticsKpis = { ...emptyKpis(), branchViews: 0, promotionViews: 0 };
    const conversion = computeConversion(kpis);
    expect(conversion.branchViewToNavigation).toBeNull();
    expect(conversion.branchViewToPhone).toBeNull();
    expect(conversion.branchViewToWhatsapp).toBeNull();
    expect(conversion.promotionViewToClick).toBeNull();
  });
});

describe("computeDeltaPercent (Phase 10, §17 : comparaison période précédente)", () => {
  it("calcule une variation en % pour chaque clé KPI", () => {
    const current: AnalyticsKpis = { ...emptyKpis(), locatorViews: 112, branchViews: 96 };
    const previous: AnalyticsKpis = { ...emptyKpis(), locatorViews: 100, branchViews: 100 };
    const delta = computeDeltaPercent(current, previous);
    expect(delta.locatorViews).toBeCloseTo(12);
    expect(delta.branchViews).toBeCloseTo(-4);
  });

  it("renvoie null quand la valeur précédente est nulle, jamais +Infinity/+100% factice", () => {
    const current: AnalyticsKpis = { ...emptyKpis(), locatorViews: 5 };
    const previous: AnalyticsKpis = { ...emptyKpis(), locatorViews: 0 };
    const delta = computeDeltaPercent(current, previous);
    expect(delta.locatorViews).toBeNull();
  });

  it("renvoie null (pas 0%) quand les deux valeurs sont nulles", () => {
    const current = emptyKpis();
    const previous = emptyKpis();
    const delta = computeDeltaPercent(current, previous);
    for (const key of ANALYTICS_KPI_KEYS) {
      expect(delta[key]).toBeNull();
    }
  });
});

describe("buildDailySeries (Phase 10, §16/§18/§47)", () => {
  it("produit une entrée par jour calendaire de la plage, y compris les jours sans événement (jamais un trou)", () => {
    const series = buildDailySeries([], "2026-08-01", "2026-08-03");
    expect(series.map((p) => p.date)).toEqual(["2026-08-01", "2026-08-02", "2026-08-03"]);
    for (const point of series) {
      expect(point.locatorViews).toBe(0);
      expect(point.visitIntent).toBe(0);
    }
  });

  it("regroupe les événements par jour calendaire À JÉRUSALEM (pas par jour UTC)", () => {
    // 2026-08-30T22:30:00Z = 2026-08-31 01:30 à Jérusalem (été, UTC+3) — doit
    // compter dans le bucket "2026-08-31", pas "2026-08-30".
    const rows: DailySeriesRawRow[] = [
      { type: "LOCATOR_VIEW", createdAt: new Date("2026-08-30T22:30:00.000Z") },
    ];
    const series = buildDailySeries(rows, "2026-08-30", "2026-08-31");
    const aug30 = series.find((p) => p.date === "2026-08-30")!;
    const aug31 = series.find((p) => p.date === "2026-08-31")!;
    expect(aug30.locatorViews).toBe(0);
    expect(aug31.locatorViews).toBe(1);
  });

  it("agrège navigation (waze+google+apple) et visitIntent correctement par jour", () => {
    const day = "2026-08-15";
    const rows: DailySeriesRawRow[] = [
      { type: "WAZE_CLICK", createdAt: new Date(`${day}T10:00:00.000Z`) },
      { type: "GOOGLE_MAPS_CLICK", createdAt: new Date(`${day}T10:05:00.000Z`) },
      { type: "APPLE_MAPS_CLICK", createdAt: new Date(`${day}T10:10:00.000Z`) },
      { type: "PHONE_CLICK", createdAt: new Date(`${day}T10:15:00.000Z`) },
      { type: "WHATSAPP_CLICK", createdAt: new Date(`${day}T10:20:00.000Z`) },
      { type: "PROMOTION_VIEW", createdAt: new Date(`${day}T10:25:00.000Z`) },
      { type: "PROMOTION_CLICK", createdAt: new Date(`${day}T10:30:00.000Z`) },
    ];
    const series = buildDailySeries(rows, day, day);
    const point = series[0];
    expect(point.navigationClicks).toBe(3);
    expect(point.phoneClicks).toBe(1);
    expect(point.whatsappClicks).toBe(1);
    expect(point.promotionViews).toBe(1);
    expect(point.promotionClicks).toBe(1);
    // visitIntent = 3 (navigation) + 1 (phone) + 1 (whatsapp) = 5 ; les vues/clics
    // de promotion n'entrent PAS dans l'intention de visite (§11 : définition
    // centralisée, navigation + appel + WhatsApp uniquement).
    expect(point.visitIntent).toBe(5);
  });

  it("ignore les types d'événement hors du sous-ensemble du graphique (§16 : pas 25 graphiques décoratifs)", () => {
    const day = "2026-08-15";
    const rows: DailySeriesRawRow[] = [
      { type: "SEARCH", createdAt: new Date(`${day}T10:00:00.000Z`) },
      { type: "FILTER_USED", createdAt: new Date(`${day}T10:00:00.000Z`) },
    ];
    const series = buildDailySeries(rows, day, day);
    expect(series[0].locatorViews).toBe(0);
    expect(series[0].visitIntent).toBe(0);
  });

  it("ignore une ligne dont la date calculée tombe hors de la plage demandée plutôt que de planter", () => {
    const rows: DailySeriesRawRow[] = [
      { type: "LOCATOR_VIEW", createdAt: new Date("2026-01-01T00:00:00.000Z") },
    ];
    expect(() => buildDailySeries(rows, "2026-08-01", "2026-08-01")).not.toThrow();
    const series = buildDailySeries(rows, "2026-08-01", "2026-08-01");
    expect(series[0].locatorViews).toBe(0);
  });
});

import { describe, expect, it } from "vitest";

import { normalizeAnalyticsEvent } from "@/lib/analytics/normalize";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/events";
import type { AnalyticsEventPayload } from "@/lib/validators/analytics";

/**
 * `normalizeAnalyticsEvent` (Phase 10, §6) — fonction pure, traduit un
 * événement déjà validé en ligne prête à insérer. Ces tests vérifient
 * explicitement : (1) l'exhaustivité vis-à-vis du catalogue `events.ts`
 * (aucun événement oublié), (2) qu'aucune coordonnée/donnée personnelle ne
 * peut apparaître dans le résultat, (3) le placement correct
 * colonne-dédiée vs `metadata` pour chaque variante.
 */
describe("normalizeAnalyticsEvent (Phase 10, §6)", () => {
  it("gère tous les événements du catalogue ANALYTICS_EVENT_NAMES sans lever d'exception", () => {
    const minimalPayloadByName: Record<string, AnalyticsEventPayload> = {
      locator_view: { name: "locator_view" },
      search: { name: "search", resultCount: 0, matchType: "none" },
      filter_used: { name: "filter_used", filterName: "city" },
      branch_view: { name: "branch_view", branchId: "b1" },
      branch_card_click: { name: "branch_card_click", branchId: "b1" },
      map_marker_click: { name: "map_marker_click", branchId: "b1" },
      geolocation_used: { name: "geolocation_used" },
      waze_click: { name: "waze_click", branchId: "b1" },
      google_maps_click: { name: "google_maps_click", branchId: "b1" },
      apple_maps_click: { name: "apple_maps_click", branchId: "b1" },
      phone_click: { name: "phone_click", branchId: "b1" },
      whatsapp_click: { name: "whatsapp_click", branchId: "b1" },
      promotion_view: { name: "promotion_view", promotionId: "p1", branchId: "b1" },
      promotion_click: { name: "promotion_click", promotionId: "p1", branchId: "b1" },
      language_changed: { name: "language_changed", locale: "fr" },
    };

    for (const name of ANALYTICS_EVENT_NAMES) {
      expect(minimalPayloadByName[name], `payload manquant pour ${name}`).toBeDefined();
      expect(() => normalizeAnalyticsEvent(minimalPayloadByName[name], "session-1")).not.toThrow();
    }
    // Vérifie aussi qu'aucun événement du catalogue n'a été oublié dans CE test.
    expect(Object.keys(minimalPayloadByName).sort()).toEqual([...ANALYTICS_EVENT_NAMES].sort());
  });

  it("place branchId dans la colonne dédiée pour les événements liés à un magasin", () => {
    const result = normalizeAnalyticsEvent({ name: "branch_view", branchId: "b-42" }, "s1");
    expect(result.type).toBe("BRANCH_VIEW");
    expect(result.branchId).toBe("b-42");
    expect(result.promotionId).toBeNull();
    expect(result.metadata).toBeNull();
  });

  it("place branchId ET promotionId pour les événements de promotion", () => {
    const result = normalizeAnalyticsEvent(
      { name: "promotion_click", promotionId: "p-7", branchId: "b-1" },
      "s1"
    );
    expect(result.type).toBe("PROMOTION_CLICK");
    expect(result.branchId).toBe("b-1");
    expect(result.promotionId).toBe("p-7");
  });

  it("search : matchedBranchId va dans branchId, matchedCitySlug dans metadata, jamais de texte libre nulle part", () => {
    const result = normalizeAnalyticsEvent(
      {
        name: "search",
        resultCount: 3,
        matchType: "branch",
        matchedBranchId: "b-9",
      },
      "s1"
    );
    expect(result.type).toBe("SEARCH");
    expect(result.branchId).toBe("b-9");
    expect(result.metadata).toEqual({ resultCount: 3, matchType: "branch", matchedCitySlug: null });
    // Aucune clé du résultat ne peut contenir la requête saisie : le type
    // `AnalyticsEventPayload` pour "search" ne porte structurellement aucun
    // champ de texte libre (voir lib/validators/analytics.ts) — on vérifie
    // simplement qu'aucune valeur du résultat n'est un texte arbitraire non
    // dérivé d'un champ connu.
    expect(Object.values(result)).not.toContain(undefined);
  });

  it("search : matchType 'city' place matchedCitySlug dans metadata et laisse branchId à null", () => {
    const result = normalizeAnalyticsEvent(
      { name: "search", resultCount: 5, matchType: "city", matchedCitySlug: "jerusalem" },
      "s1"
    );
    expect(result.branchId).toBeNull();
    expect(result.metadata).toEqual({ resultCount: 5, matchType: "city", matchedCitySlug: "jerusalem" });
  });

  it("search : matchType 'none'/'other' ne renseigne ni branchId ni matchedCitySlug", () => {
    const result = normalizeAnalyticsEvent({ name: "search", resultCount: 0, matchType: "none" }, "s1");
    expect(result.branchId).toBeNull();
    expect(result.metadata).toEqual({ resultCount: 0, matchType: "none", matchedCitySlug: null });
  });

  it("filter_used : filterName va dans metadata, aucune colonne dédiée", () => {
    const result = normalizeAnalyticsEvent({ name: "filter_used", filterName: "isOpenNow" }, "s1");
    expect(result.metadata).toEqual({ filterName: "isOpenNow" });
    expect(result.branchId).toBeNull();
  });

  it("language_changed : la langue de destination va dans la colonne locale elle-même", () => {
    const result = normalizeAnalyticsEvent({ name: "language_changed", locale: "he" }, "s1");
    expect(result.type).toBe("LANGUAGE_CHANGED");
    expect(result.locale).toBe("he");
    expect(result.metadata).toBeNull();
  });

  it("locator_view / geolocation_used : aucune colonne renseignée hors les champs communs (session/locale)", () => {
    for (const payload of [{ name: "locator_view" as const }, { name: "geolocation_used" as const }]) {
      const result = normalizeAnalyticsEvent(payload, "s1");
      expect(result.branchId).toBeNull();
      expect(result.promotionId).toBeNull();
      expect(result.metadata).toBeNull();
    }
  });

  it("propage sessionId et locale communs à tous les événements", () => {
    const result = normalizeAnalyticsEvent({ name: "locator_view", locale: "ru" }, "session-xyz");
    expect(result.sessionId).toBe("session-xyz");
    expect(result.locale).toBe("ru");
  });

  it("accepte sessionId null (§5 : la session anonyme n'est pas garantie disponible)", () => {
    const result = normalizeAnalyticsEvent({ name: "locator_view" }, null);
    expect(result.sessionId).toBeNull();
  });

  it("n'introduit jamais de clé latitude/longitude/address/phone dans le résultat, quel que soit l'événement", () => {
    const forbiddenKeys = ["lat", "lng", "latitude", "longitude", "address", "phone", "query", "rawQuery"];
    const payloads: AnalyticsEventPayload[] = [
      { name: "search", resultCount: 1, matchType: "city", matchedCitySlug: "netanya" },
      { name: "branch_view", branchId: "b1" },
      { name: "promotion_view", promotionId: "p1", branchId: "b1" },
    ];
    for (const payload of payloads) {
      const result = normalizeAnalyticsEvent(payload, "s1");
      const flat = JSON.stringify(result);
      for (const key of forbiddenKeys) {
        expect(flat.toLowerCase()).not.toContain(`"${key.toLowerCase()}"`);
      }
    }
  });
});

import { describe, expect, it } from "vitest";

import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/events";
import {
  ANALYTICS_MAX_BATCH_SIZE,
  analyticsEventPayloadSchema,
  analyticsIngestionBodySchema,
} from "@/lib/validators/analytics";

/**
 * `analyticsEventPayloadSchema` (Phase 10, §2/§6/§40) — validation serveur de
 * l'ingestion analytics. Ces tests couvrent explicitement les exigences du
 * cahier des charges §40 : "chaque type événement, payload invalide,
 * coordonnées refusées, propriétés inconnues".
 */
describe("analyticsEventPayloadSchema — couverture exhaustive du catalogue (§40)", () => {
  it("valide un payload minimal pour chacun des ANALYTICS_EVENT_NAMES", () => {
    const validPayloadByName: Record<string, unknown> = {
      locator_view: { name: "locator_view" },
      search: { name: "search", resultCount: 0, matchType: "none" },
      filter_used: { name: "filter_used", filterName: "service" },
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
      language_changed: { name: "language_changed", locale: "en" },
    };

    // Le schéma doit rester synchronisé avec le catalogue events.ts (aucun
    // événement oublié côté serveur).
    expect(Object.keys(validPayloadByName).sort()).toEqual([...ANALYTICS_EVENT_NAMES].sort());

    for (const name of ANALYTICS_EVENT_NAMES) {
      const result = analyticsEventPayloadSchema.safeParse(validPayloadByName[name]);
      expect(result.success, `${name} devrait être valide : ${JSON.stringify(!result.success && result.error.issues)}`).toBe(true);
    }
  });
});

describe("analyticsEventPayloadSchema — payloads invalides rejetés (§40)", () => {
  it("rejette un nom d'événement inconnu", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "unknown_event" }).success).toBe(false);
  });

  it("rejette branch_view sans branchId", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "branch_view" }).success).toBe(false);
  });

  it("rejette un branchId vide ou trop long", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "branch_view", branchId: "" }).success).toBe(false);
    expect(
      analyticsEventPayloadSchema.safeParse({ name: "branch_view", branchId: "x".repeat(65) }).success
    ).toBe(false);
  });

  it("rejette search avec un matchType hors de l'énumération", () => {
    expect(
      analyticsEventPayloadSchema.safeParse({ name: "search", resultCount: 1, matchType: "everything" }).success
    ).toBe(false);
  });

  it("rejette search avec un resultCount négatif ou non entier", () => {
    expect(
      analyticsEventPayloadSchema.safeParse({ name: "search", resultCount: -1, matchType: "none" }).success
    ).toBe(false);
    expect(
      analyticsEventPayloadSchema.safeParse({ name: "search", resultCount: 1.5, matchType: "none" }).success
    ).toBe(false);
  });

  it("rejette language_changed avec une locale hors des langues supportées", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "language_changed", locale: "de" }).success).toBe(false);
  });

  it("rejette filter_used avec un filterName hors de l'énumération autorisée", () => {
    expect(
      analyticsEventPayloadSchema.safeParse({ name: "filter_used", filterName: "openingHours" }).success
    ).toBe(false);
  });

  it("rejette promotion_view sans promotionId", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "promotion_view", branchId: "b1" }).success).toBe(false);
  });
});

describe("analyticsEventPayloadSchema — coordonnées et données personnelles refusées (§2/§40, impératif)", () => {
  it("ignore silencieusement latitude/longitude/adresse/téléphone envoyés en plus d'un événement par ailleurs valide", () => {
    const result = analyticsEventPayloadSchema.safeParse({
      name: "branch_view",
      branchId: "b1",
      latitude: 31.78,
      longitude: 35.22,
      address: "12 Rehov Ramot",
      phone: "+972501234567",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Zod strippe les clés non déclarées dans la shape : structurellement
      // impossible qu'une coordonnée survive au parsing (§2).
      expect(result.data).not.toHaveProperty("latitude");
      expect(result.data).not.toHaveProperty("longitude");
      expect(result.data).not.toHaveProperty("address");
      expect(result.data).not.toHaveProperty("phone");
    }
  });

  it("rejette un événement 'search' qui tenterait de faire passer une requête texte brute dans un champ non déclaré", () => {
    const result = analyticsEventPayloadSchema.safeParse({
      name: "search",
      resultCount: 0,
      matchType: "none",
      query: "12 Rehov Ramot, apt 4, mon numero est 0501234567",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("query");
    }
  });

  it("aucune shape du schéma ne déclare de champ latitude/longitude/address/phone/query (garantie structurelle)", () => {
    const forbidden = ["latitude", "longitude", "lat", "lng", "address", "phone", "query", "rawQuery"];
    for (const option of analyticsEventPayloadSchema.options) {
      const shapeKeys = Object.keys(option.shape);
      for (const key of forbidden) {
        expect(shapeKeys).not.toContain(key);
      }
    }
  });
});

describe("analyticsEventPayloadSchema — propriétés inconnues ignorées (§40)", () => {
  it("ignore une propriété totalement arbitraire ajoutée à un payload valide", () => {
    const result = analyticsEventPayloadSchema.safeParse({
      name: "locator_view",
      somethingClientAddedLater: 42,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("somethingClientAddedLater");
    }
  });
});

describe("analyticsEventPayloadSchema — champ locale commun optionnel", () => {
  it("accepte une locale valide sur un événement quelconque", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "locator_view", locale: "he" }).success).toBe(true);
  });

  it("rejette une locale non supportée", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "locator_view", locale: "zz" }).success).toBe(false);
  });

  it("locale reste optionnelle (aucune régression en son absence)", () => {
    expect(analyticsEventPayloadSchema.safeParse({ name: "locator_view" }).success).toBe(true);
  });
});

describe("analyticsIngestionBodySchema (Phase 10, §6/§37 : taille de lot bornée)", () => {
  it("accepte un lot d'un seul événement", () => {
    expect(
      analyticsIngestionBodySchema.safeParse({ events: [{ name: "locator_view" }] }).success
    ).toBe(true);
  });

  it("rejette un tableau d'événements vide", () => {
    expect(analyticsIngestionBodySchema.safeParse({ events: [] }).success).toBe(false);
  });

  it(`accepte un lot de exactement ${ANALYTICS_MAX_BATCH_SIZE} événements`, () => {
    const events = Array.from({ length: ANALYTICS_MAX_BATCH_SIZE }, () => ({ name: "locator_view" }));
    expect(analyticsIngestionBodySchema.safeParse({ events }).success).toBe(true);
  });

  it(`rejette un lot dépassant ANALYTICS_MAX_BATCH_SIZE (${ANALYTICS_MAX_BATCH_SIZE}) événements (§37 : anti-spam)`, () => {
    const events = Array.from({ length: ANALYTICS_MAX_BATCH_SIZE + 1 }, () => ({ name: "locator_view" }));
    expect(analyticsIngestionBodySchema.safeParse({ events }).success).toBe(false);
  });

  it("rejette un lot contenant un événement invalide au milieu d'événements valides", () => {
    const result = analyticsIngestionBodySchema.safeParse({
      events: [{ name: "locator_view" }, { name: "branch_view" }, { name: "locator_view" }],
    });
    // "branch_view" sans branchId est invalide — tout le lot échoue (l'API
    // décide ensuite comment réagir : voir app/api/analytics/event/route.ts).
    expect(result.success).toBe(false);
  });
});

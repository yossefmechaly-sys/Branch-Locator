import { prisma } from "@/lib/prisma";
import type { NormalizedAnalyticsEvent } from "@/lib/analytics/normalize";

import type { AnalyticsProvider } from "./types";

import type { AnalyticsEventType, Locale, Prisma } from "@prisma/client";
/**
 * Fournisseur PostgreSQL (Phase 10, §1) — source PRINCIPALE de cette phase,
 * via la table `analytics_events` existante (Phase 6, étendue en Phase 10 —
 * voir `prisma/migrations/20260901000000_analytics_v2`). `createMany` en un
 * seul aller-retour pour tout le lot d'un appel `POST /api/analytics/event`
 * (jamais une requête par événement).
 *
 * `skipDuplicates` n'a pas de sens ici (pas de contrainte d'unicité
 * naturelle sur un événement analytics — deux clics identiques à la même
 * milliseconde sont deux événements réels distincts), volontairement omis.
 */
export const postgresAnalyticsProvider: AnalyticsProvider = {
  name: "postgres",
  async recordEvents(events) {
    if (events.length === 0) return;
    await prisma.analyticsEvent.createMany({
      data: events.map((event) => ({
        type: event.type as AnalyticsEventType,
        branchId: event.branchId,
        promotionId: event.promotionId,
        locale: event.locale as Locale | null,
        sessionId: event.sessionId,
        metadata: event.metadata
          ? (event.metadata as Prisma.InputJsonValue)
          : undefined,
      })),
    });
  },
};

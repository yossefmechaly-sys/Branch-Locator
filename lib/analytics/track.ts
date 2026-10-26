import type { AnalyticsEvent } from "./events";

const INGESTION_URL = "/api/analytics/event";

/**
 * Point d'entrée UNIQUE pour tout événement analytics (§23 Phase 8 — non
 * réécrit, toujours vrai) : les composants UI n'assemblent jamais eux-mêmes
 * un appel réseau analytics, ils appellent `track(event)` et n'en attendent
 * JAMAIS le résultat (aucune valeur de retour, aucune `Promise`) — voir §7
 * Phase 10 : un clic Waze/Maps/WhatsApp ne doit jamais être retardé, encore
 * moins bloqué, par l'analytics.
 *
 * Implémentation réelle Phase 10 (§6/§7) : `navigator.sendBeacon()` en
 * priorité — conçu précisément pour "envoyer et continuer", y compris quand
 * la page se décharge immédiatement après (ex. `whatsapp_click` ouvre un
 * nouvel onglet). Repli sur `fetch(..., { keepalive: true })` quand
 * `sendBeacon` est absent (environnement de test) ou refuse l'envoi (file
 * d'attente navigateur pleine). Chaque appel envoie un lot d'un seul
 * événement — la route d'ingestion accepte un lot plus grand pour un futur
 * appelant qui en aurait besoin (§6), mais rien ici ne le demande
 * aujourd'hui : pas de fenêtre de regroupement à gérer côté client, donc pas
 * de risque de perdre des événements en attente au déchargement de la page.
 *
 * AUCUNE exception ne doit jamais s'échapper de cette fonction (§7 : une
 * panne analytics ne casse jamais le Store Locator) — `try/catch` large et
 * volontairement silencieux en production ; un `console.debug` seulement en
 * développement pour le diagnostic.
 */
export function track(event: AnalyticsEvent): void {
  try {
    if (typeof window === "undefined") return;

    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics]", event.name, event);
    }

    const body = JSON.stringify({ events: [event] });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const accepted = navigator.sendBeacon(INGESTION_URL, blob);
      if (accepted) return;
    }

    if (typeof fetch === "function") {
      void fetch(INGESTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Silencieux à dessein (§7) — voir le commentaire de tête.
      });
    }
  } catch {
    // Ne remonte jamais (§7) — un navigateur exotique ou un bloqueur de
    // requêtes ne doit jamais transformer un clic Waze/téléphone/WhatsApp en
    // erreur visible pour l'utilisateur.
  }
}

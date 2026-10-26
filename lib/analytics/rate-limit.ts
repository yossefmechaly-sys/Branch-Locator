/**
 * Limitation de débit de l'ingestion analytics (Phase 10, §7/§37) —
 * protection "raisonnable" contre une génération artificielle massive
 * d'événements, EXPLICITEMENT pas un système enterprise complet (§37) :
 * fenêtre fixe en mémoire, par clé (session anonyme si connue, sinon IP).
 *
 * LIMITE CONNUE, documentée (voir le rapport final Phase 10) : cet état est
 * local à CE processus Node — dans un déploiement multi-instance/horizontal,
 * chaque instance a sa propre fenêtre, donc la limite réelle globale est
 * `limite × nombre d'instances`. Suffisant pour l'échelle actuelle du
 * projet (§37 : "pas besoin d'un système enterprise complexe") ; une vraie
 * limitation distribuée (Redis, etc.) serait un prérequis avant un
 * déploiement multi-instance à fort trafic.
 */
const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 60;
/** Borne haute du nombre de clés suivies simultanément — au-delà, les entrées
 * les plus anciennes sont purgées opportunistement pour ne jamais laisser
 * cette table grossir sans limite (pas de purge périodique séparée à
 * maintenir). */
const MAX_TRACKED_KEYS = 5_000;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function pruneIfNeeded(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
  }
}

/** `true` si la requête est autorisée à consommer `cost` événements
 * maintenant (incrémente le compteur dans la foulée) ; `false` si la limite
 * de la fenêtre courante est déjà atteinte. */
export function consumeRateLimit(key: string, cost: number, now: number = Date.now()): boolean {
  pruneIfNeeded(now);

  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    buckets.set(key, { count: cost, windowStart: now });
    return cost <= MAX_EVENTS_PER_WINDOW;
  }

  if (existing.count + cost > MAX_EVENTS_PER_WINDOW) return false;
  existing.count += cost;
  return true;
}

/** Réservé aux tests — jamais appelé par le code applicatif. */
export function __resetRateLimitStateForTests(): void {
  buckets.clear();
}

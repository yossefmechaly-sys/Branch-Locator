import { randomUUID } from "node:crypto";

/**
 * Store en mémoire des imports en attente de confirmation (Phase 10, §24/§25)
 * — le workflow est Upload → Parsing → Validation → Preview → Confirmation →
 * Import : entre l'aperçu et la confirmation, l'utilisateur peut fermer un
 * onglet, hésiter, ou changer de page ; on ne fait donc PAS confiance à un
 * champ caché de formulaire pour retransmettre les lignes déjà parsées (un
 * `<input type="hidden">` avec des centaines de lignes serait de toute façon
 * peu robuste). Les LIGNES BRUTES (pas le fichier binaire) sont conservées
 * ici, keyed par un `importId` opaque, pour une durée courte — la
 * confirmation revalide ensuite ces mêmes lignes avec `analyzeBranchImportRows`
 * (§25 : littéralement le même appel qu'à l'aperçu, jamais un second moteur)
 * contre l'état ACTUEL de la base (villes/services/magasins ont pu changer
 * entre-temps).
 *
 * LIMITE CONNUE (documentée, même principe que `lib/analytics/rate-limit.ts`) :
 * store en mémoire du processus — non partagé entre plusieurs instances
 * serverless/replicas. Acceptable pour le volume et le mode de déploiement
 * actuels (un back-office interne, usage non concurrent à grande échelle) ;
 * la prochaine étape si nécessaire serait Redis/une table dédiée.
 */

const PENDING_IMPORT_TTL_MS = 20 * 60 * 1000; // 20 minutes

interface PendingImport {
  rawRows: Record<string, string>[];
  headerKeys: string[];
  fileName: string;
  entityType: "branch";
  createdBy: string;
  expiresAt: number;
}

const store = new Map<string, PendingImport>();

function purgeExpired(now: number): void {
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

export function createPendingImport(
  data: Omit<PendingImport, "expiresAt">
): string {
  const now = Date.now();
  purgeExpired(now);
  const importId = randomUUID();
  store.set(importId, { ...data, expiresAt: now + PENDING_IMPORT_TTL_MS });
  return importId;
}

/** Consultation SANS consommer (utilisée si besoin d'un second regard) —
 * `takePendingImport` reste la voie normale pour l'exécution réelle. */
export function peekPendingImport(importId: string): PendingImport | null {
  const now = Date.now();
  purgeExpired(now);
  return store.get(importId) ?? null;
}

/** Récupère ET supprime — un `importId` est à usage UNIQUE (§28 : éviter les
 * doubles soumissions, un double clic sur « Confirmer » ne doit jamais
 * importer deux fois). */
export function takePendingImport(importId: string): PendingImport | null {
  const now = Date.now();
  purgeExpired(now);
  const entry = store.get(importId);
  if (!entry) return null;
  store.delete(importId);
  return entry;
}

/** Réservé aux tests. */
export function __resetPendingImportsForTests(): void {
  store.clear();
}

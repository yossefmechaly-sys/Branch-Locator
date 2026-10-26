import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * `GET /api/health` (Phase 11, §16bis — observabilité) — point de contrôle
 * minimal pour un load balancer/orchestrateur (probe de disponibilité), pas
 * un tableau de bord de diagnostic.
 *
 * Volontairement MINIMAL : ne retourne JAMAIS `DATABASE_URL`/aucun secret,
 * aucune version de dépendance, aucune trace de pile — uniquement un statut
 * `ok`/`degraded` et un timestamp. Un `SELECT 1` trivial confirme que la
 * connexion Postgres répond réellement (pas seulement que le process Node
 * tourne) ; toute erreur est interceptée et journalisée côté serveur
 * uniquement (même pattern que `app/api/branches/route.ts`), jamais renvoyée
 * au client.
 *
 * `export const dynamic = "force-dynamic"` : cette route ne doit JAMAIS être
 * mise en cache/statique — chaque appel doit refléter l'état réel actuel de
 * la base, pas un résultat figé au build.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[GET /api/health]", error);
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}

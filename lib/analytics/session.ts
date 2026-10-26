/**
 * Session anonyme (Phase 10, §5) — un identifiant ALÉATOIRE, sans aucune
 * donnée personnelle, sans fingerprinting (aucune empreinte calculée à partir
 * du user-agent, de l'écran, des polices, etc.) et sans identifiant
 * publicitaire (jamais un IDFA/GAID ou équivalent). Sert UNIQUEMENT à
 * regrouper les événements d'une même visite pour compter des sessions et
 * des parcours (§5, §11) — jamais à ré-identifier une personne d'une visite
 * à l'autre au-delà de la fenêtre ci-dessous.
 *
 * DURÉE DOCUMENTÉE (§5, exigé explicitement) : 30 minutes GLISSANTES — chaque
 * événement reçu prolonge le cookie de 30 minutes supplémentaires (voir
 * `route.ts`), donc une session active ne meurt jamais en plein usage, mais
 * une inactivité de 30 minutes en marque la fin. Cookie `httpOnly` (jamais
 * lu par du JavaScript tiers), `sameSite=lax`, jamais transmis à un domaine
 * tiers.
 */
export const ANALYTICS_SESSION_COOKIE_NAME = "m2k_aid";
export const ANALYTICS_SESSION_TTL_SECONDS = 30 * 60;

const SESSION_ID_PATTERN = /^[a-f0-9-]{16,64}$/i;

export function generateAnonymousSessionId(): string {
  return crypto.randomUUID();
}

/** Un cookie entrant n'est jamais fait confiance aveuglément (défense en
 * profondeur, cahier des charges §58 Phase 5/§24 Phase 9 appliqués ici aussi)
 * — une valeur de forme inattendue déclenche simplement la génération d'un
 * nouvel identifiant, jamais une erreur. */
export function isValidSessionId(value: string | undefined | null): value is string {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value);
}

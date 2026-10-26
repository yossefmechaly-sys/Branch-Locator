/**
 * Détection iOS/macOS, PURE (prend le `userAgent` en paramètre plutôt que de
 * lire `navigator` directement) pour rester testable sans DOM (§12 Phase 6).
 * Cette détection ne conditionne jamais le FONCTIONNEMENT de la navigation —
 * seulement l'ORDRE d'affichage d'Apple Maps dans le menu (§12, impératif :
 * "cette détection ne doit pas être critique au fonctionnement"). Si elle se
 * trompe (UA usurpé, navigateur inconnu…), Apple Maps reste disponible, juste
 * pas en premier.
 */
export function isAppleDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod|macintosh/i.test(userAgent);
}

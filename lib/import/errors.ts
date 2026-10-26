/**
 * Erreurs domaine de l'import (Phase 10, §36) — traduites en
 * `AdminMutationResult` normalisé par `lib/admin/mutation-result.ts`, même
 * principe que `InvalidUploadError`/`GeocodingError` (Phase 9).
 */

/** Fichier rejeté AVANT même le parsing métier — extension/MIME/taille/lignes
 * hors bornes (§36), ou fichier illisible/corrompu. */
export class ImportFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportFileError";
  }
}

/** `importId` inconnu, déjà consommé (double clic sur « Confirmer », §19),
 * ou expiré (TTL de `lib/import/pending-imports.ts`) — l'utilisateur doit
 * réimporter le fichier, jamais une écriture silencieusement ignorée. */
export class ImportSessionExpiredError extends Error {
  constructor(message = "Session d'import expirée ou déjà utilisée — veuillez réimporter le fichier") {
    super(message);
    this.name = "ImportSessionExpiredError";
  }
}

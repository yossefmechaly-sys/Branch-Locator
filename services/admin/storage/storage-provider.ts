/**
 * Abstraction de stockage de fichiers (Phase 9, §10) — le reste du
 * back-office (Server Actions, `branch-admin.service.ts`) ne dépend QUE de
 * cette interface, jamais directement du système de fichiers local. Permet
 * de remplacer `localStorageProvider` (développement) par une implémentation
 * S3/R2 en Phase 10+ sans toucher à un seul appelant — même principe que
 * `BranchRepository` découplé de Prisma (Phase 4, §7).
 */
export interface StoredFile {
  /** URL publique servable telle quelle par `<Image>`/`<img>` (chemin relatif
   * pour le stockage local, URL absolue pour un futur backend S3/R2). */
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface UploadInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface StorageProvider {
  save(file: UploadInput): Promise<StoredFile>;
  /** Idempotent : ne lève jamais si le fichier n'existe déjà plus. */
  delete(url: string): Promise<void>;
}

/** Levée par une implémentation `StorageProvider` quand le fichier échoue à
 * une validation RÉELLE (MIME déclaré vs contenu réel, taille, corruption) —
 * jamais une simple confiance dans l'extension du nom de fichier ou l'en-tête
 * `Content-Type` envoyé par le navigateur (§10, impératif : « valider
 * réellement »). */
export class InvalidUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUploadError";
  }
}

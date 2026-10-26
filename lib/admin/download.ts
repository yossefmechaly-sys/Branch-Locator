/**
 * Déclenche le téléchargement navigateur d'un fichier renvoyé par une Server
 * Action d'export (Phase 10, Partie E) — CSV en texte UTF-8 direct, XLSX en
 * base64 (une Server Action ne peut pas renvoyer un `Buffer` binaire brut de
 * façon fiable à travers la frontière RSC, voir `FileDownloadResponse`).
 * Fonction client uniquement (`URL.createObjectURL`/DOM) — jamais appelée
 * côté serveur.
 */
export interface DownloadableFile {
  fileName: string;
  mimeType: string;
  content: string;
  encoding: "utf-8" | "base64";
}

export function triggerFileDownload(file: DownloadableFile): void {
  const blob =
    file.encoding === "base64"
      ? new Blob([Uint8Array.from(atob(file.content), (c) => c.charCodeAt(0))], { type: file.mimeType })
      : new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

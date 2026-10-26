import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  InvalidUploadError,
  type StorageProvider,
  type StoredFile,
  type UploadInput,
} from "./storage-provider";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

const ALLOWED_TYPES: Record<
  string,
  { extension: string; matches: (buffer: Buffer) => boolean }
> = {
  "image/jpeg": {
    extension: ".jpg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extension: ".png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47,
  },
  "image/webp": {
    extension: ".webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
};

function createLocalStorageProvider(
  uploadDir: string,
  publicPrefix: string
): StorageProvider {
  return {
    async save({ buffer, mimeType }: UploadInput): Promise<StoredFile> {
      const typeConfig = ALLOWED_TYPES[mimeType];

      if (!typeConfig) {
        throw new InvalidUploadError(
          `Type de fichier non autorisé (${mimeType || "inconnu"}) — JPEG, PNG ou WebP uniquement`
        );
      }

      if (buffer.byteLength === 0) {
        throw new InvalidUploadError("Fichier vide");
      }

      if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
        throw new InvalidUploadError(
          "Fichier trop volumineux (5 Mo maximum)"
        );
      }

      if (!typeConfig.matches(buffer)) {
        throw new InvalidUploadError(
          "Le contenu du fichier ne correspond pas au type déclaré (fichier corrompu ou renommé)"
        );
      }

      await mkdir(uploadDir, { recursive: true });

      const filename = `${randomUUID()}${typeConfig.extension}`;

      await writeFile(
        path.join(/* turbopackIgnore: true */ uploadDir, filename),
        buffer
      );

      return {
        url: `${publicPrefix}/${filename}`,
        filename,
        size: buffer.byteLength,
        mimeType,
      };
    },

    async delete(url: string): Promise<void> {
      if (!url.startsWith(`${publicPrefix}/`)) return;

      const filename = path.basename(url);

      await unlink(
        path.join(/* turbopackIgnore: true */ uploadDir, filename)
      ).catch(() => undefined);
    },
  };
}

const BRANCH_UPLOAD_DIR =
  process.env.BRANCH_UPLOAD_DIR ??
  path.join(process.cwd(), "public", "uploads", "branches");

const PROMOTION_UPLOAD_DIR =
  process.env.PROMOTION_UPLOAD_DIR ??
  path.join(process.cwd(), "public", "uploads", "promotions");

/**
 * Photos des magasins.
 *
 * Le nom d'export historique est conservé afin de ne casser aucun appelant.
 */
export const localStorageProvider = createLocalStorageProvider(
  BRANCH_UPLOAD_DIR,
  "/uploads/branches"
);

/**
 * Images des promotions.
 */
export const promotionStorageProvider = createLocalStorageProvider(
  PROMOTION_UPLOAD_DIR,
  "/uploads/promotions"
);

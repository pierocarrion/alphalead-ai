import { readFileStorageConfig, type FileStorageConfig, type IFileStorage } from "./IFileStorage";
import { LocalFileStorage } from "./LocalFileStorage";
import { GcsFileStorage } from "./GcsFileStorage";

let cached: IFileStorage | null = null;

/**
 * Resolves the active file storage backend from env (`FILE_STORAGE`).
 * Returns GCS when configured and credentials are present; otherwise the local
 * filesystem backend (always available).
 */
export function getFileStorage(): IFileStorage {
  if (cached) return cached;
  cached = createFileStorage();
  return cached;
}

export function createFileStorage(config: FileStorageConfig = readFileStorageConfig()): IFileStorage {
  if (config.backend === "gcs" && config.gcsBucket) {
    return new GcsFileStorage(config);
  }
  return new LocalFileStorage(config.localDir);
}

/** Test-only override. */
export function setFileStorage(storage: IFileStorage): void {
  cached = storage;
}

export type { FileStorageConfig, IFileStorage, StoredFile } from "./IFileStorage";

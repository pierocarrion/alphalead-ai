/**
 * File storage abstraction (Strategy pattern). Implementations:
 *  - {@link LocalFileStorage}: dev / self-hosted (filesystem)
 *  - {@link GcsFileStorage}:  production on Google Cloud Storage
 *
 * The active backend is chosen by `FILE_STORAGE` env (gcs | local) and is
 * invisible to callers, who depend only on {@link IFileStorage}.
 */
export interface StoredFile {
  storageKey: string;
  contentType: string;
  size: number;
}

export interface IFileStorage {
  readonly kind: string;
  put(path: string, data: Buffer, contentType: string): Promise<StoredFile>;
  get(path: string): Promise<Buffer>;
  /** Returns a signed/resolved URL for download, or null when not applicable. */
  getUrl(path: string): Promise<string | null>;
  delete(path: string): Promise<void>;
}

export interface FileStorageConfig {
  backend: "local" | "gcs";
  localDir: string;
  gcsBucket: string;
  gcsPrefix: string;
  publicBaseUrl: string;
}

export function readFileStorageConfig(env: NodeJS.ProcessEnv = process.env): FileStorageConfig {
  return {
    backend: (env.FILE_STORAGE ?? "local") === "gcs" ? "gcs" : "local",
    localDir: env.FILE_STORAGE_LOCAL_DIR ?? ".uploads",
    gcsBucket: env.GCS_BUCKET ?? "",
    gcsPrefix: env.GCS_KNOWLEDGE_PREFIX ?? "knowledge/",
    publicBaseUrl: env.FILE_STORAGE_PUBLIC_BASE_URL ?? "",
  };
}

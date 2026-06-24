import type { IFileStorage, StoredFile } from "./IFileStorage";
import type { FileStorageConfig } from "./IFileStorage";

/**
 * Google Cloud Storage backend. The `@google-cloud/storage` SDK is imported
 * lazily so it remains an optional dependency — the app boots fine without it
 * (e.g. local dev), and it's only loaded when FILE_STORAGE=gcs is configured.
 */
export class GcsFileStorage implements IFileStorage {
  readonly kind = "gcs";
  private readonly config: FileStorageConfig;
  private bucketPromise: Promise<unknown> | null = null;

  constructor(config: FileStorageConfig) {
    this.config = config;
  }

  private async getBucket() {
    if (!this.bucketPromise) {
      this.bucketPromise = (async () => {
        const mod = await import("@google-cloud/storage");
        const storage = new mod.Storage();
        return storage.bucket(this.config.gcsBucket);
      })();
    }
    return this.bucketPromise as Promise<{
      file(path: string): {
        save(data: Buffer, opts: { metadata: { contentType: string } }): Promise<void>;
        download(): Promise<Buffer[]>;
        delete(): Promise<void>;
        getSignedUrl(cfg: { version: string; action: string; expires: number }): Promise<string[]>;
        publicUrl(): string;
        makePublic(): Promise<void>;
      };
    }>;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
    const bucket = await this.getBucket();
    const file = bucket.file(`${this.config.gcsPrefix}${key}`);
    await file.save(data, { metadata: { contentType } });
    return { storageKey: key, contentType, size: data.byteLength };
  }

  async get(key: string): Promise<Buffer> {
    const bucket = await this.getBucket();
    const file = bucket.file(`${this.config.gcsPrefix}${key}`);
    const [buffer] = await file.download();
    return buffer;
  }

  async getUrl(key: string): Promise<string | null> {
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl}/${this.config.gcsPrefix}${key}`;
    }
    const bucket = await this.getBucket();
    const file = bucket.file(`${this.config.gcsPrefix}${key}`);
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });
    return url;
  }

  async delete(key: string): Promise<void> {
    const bucket = await this.getBucket();
    await bucket.file(`${this.config.gcsPrefix}${key}`).delete().catch(() => undefined);
  }
}

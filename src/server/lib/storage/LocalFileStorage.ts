import { promises as fs } from "node:fs";
import path from "node:path";
import type { IFileStorage, StoredFile } from "./IFileStorage";

/**
 * Filesystem-backed storage for local development and self-hosted deployments.
 * Paths are sandboxed under {@link root} to prevent traversal outside the dir.
 */
export class LocalFileStorage implements IFileStorage {
  readonly kind = "local";
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    const safe = path.normalize(key).replace(/^([/\\]|[a-zA-Z]:)/, "");
    const resolved = path.resolve(this.root, safe);
    if (!resolved.startsWith(path.resolve(this.root))) {
      throw new Error("Invalid storage path");
    }
    return resolved;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return { storageKey: key, contentType, size: data.byteLength };
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async getUrl(_key: string): Promise<string | null> {
    // Local dev has no public URL; downloads are proxied via an API route.
    return null;
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(this.resolve(key)).catch(() => undefined);
  }
}

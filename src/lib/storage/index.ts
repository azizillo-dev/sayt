import "server-only";
import { localStorageDriver } from "./local";
import { s3StorageDriver } from "./s3";

export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Reads an object back: originals are processed after the browser stores them. */
  get(key: string): Promise<Buffer>;
  delete(keys: string[]): Promise<void>;
  publicUrl(key: string): string;
  /**
   * A URL the browser can PUT the original file to, so the bytes never pass
   * through the app. Hosts cap request bodies well below what a designer's
   * exports weigh (4.5 MB on Vercel), which uploading direct avoids.
   */
  uploadUrl(key: string, contentType: string): Promise<string>;
}

function createDriver(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  switch (driver) {
    case "s3":
      return s3StorageDriver();
    case "local":
      return localStorageDriver();
    default:
      throw new Error(`Unknown STORAGE_DRIVER "${driver}"`);
  }
}

export const storage = createDriver();

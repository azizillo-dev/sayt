import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from ".";

/** Files served by `src/app/media/[...key]/route.ts`. */
export const LOCAL_STORAGE_ROOT = path.join(process.cwd(), "storage");

export function resolveLocalPath(key: string): string | null {
  const resolved = path.resolve(LOCAL_STORAGE_ROOT, key);
  // Reject path traversal ("../../etc/passwd").
  return resolved.startsWith(LOCAL_STORAGE_ROOT + path.sep) ? resolved : null;
}

export function localStorageDriver(): StorageDriver {
  return {
    async put(key, body) {
      const file = resolveLocalPath(key);
      if (!file) throw new Error(`Invalid storage key: ${key}`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
    },
    async get(key) {
      const file = resolveLocalPath(key);
      if (!file) throw new Error(`Invalid storage key: ${key}`);
      return readFile(file);
    },
    /** No signing needed: the route behind this URL checks the admin session. */
    async uploadUrl(key) {
      return `/api/admin/upload/direct?key=${encodeURIComponent(key)}`;
    },
    async delete(keys) {
      await Promise.all(
        keys.map((key) => {
          const file = resolveLocalPath(key);
          return file ? rm(file, { force: true }) : undefined;
        }),
      );
    },
    publicUrl(key) {
      return `/media/${key}`;
    },
  };
}

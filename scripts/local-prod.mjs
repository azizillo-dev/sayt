/**
 * Runs `next build` / `next start` against the LOCAL database and storage.
 *
 * Next always loads .env.production.local for these commands, and that file
 * points at the production Neon database — whose schema can be behind the
 * code while a feature is still local. Values already in process.env win
 * over .env files, so loading .env here first keeps the build local.
 *
 *   npm run local:build
 *   npm run local:start          # http://localhost:3100
 */
import { spawnSync } from "node:child_process";

process.loadEnvFile(".env");
process.env.STORAGE_DRIVER ||= "local";

const result = spawnSync("npx", ["next", ...process.argv.slice(2)], { stdio: "inherit", shell: true, env: process.env });
process.exit(result.status ?? 1);

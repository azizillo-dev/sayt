import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const production = process.env.NODE_ENV === "production";

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };
const client =
  globalForDb.pgClient ??
  postgres(url, {
    // Serverless: every running instance holds its own pool, so each keeps it
    // small and lets the database's pooler (Neon) do the multiplexing. Not 1:
    // one instance may serve several requests at once.
    max: production ? 5 : 10,
    // A transaction-mode pooler hands each query to whichever connection is
    // free, where a statement prepared on another connection does not exist.
    prepare: false,
  });
if (!production) globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "#schema";

/**
 * Creates a drizzle client backed by a postgres-js connection, typed with the full schema.
 * The connection is opened lazily on first query; call {@link closeDb} to release it.
 *
 * @param url - Postgres connection string.
 */
export function openDb(url: string) {
  return drizzle(postgres(url), { schema });
}

/** The database client returned by {@link openDb}. */
export type Db = ReturnType<typeof openDb>;

/**
 * Closes the underlying connection. Without this, an open connection keeps the process alive.
 *
 * @param db - The client to close; it must not be used afterwards.
 */
export async function closeDb(db: Db): Promise<void> {
  await db.$client.end();
}

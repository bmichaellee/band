import { sql } from "drizzle-orm";

import type { Db } from "#db";

/**
 * Checks that the database is reachable by running a trivial `select 1`.
 * Needs no tables, so it works before any migration has been applied.
 *
 * @returns `true` if the query succeeded, `false` if it threw (the error is discarded).
 */
export async function checkDbHealth(db: Db): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

import type { User } from "@band-tools/types";

import type { Db } from "#db";
import { usersTable } from "#schema";

/**
 * Inserts a user row.
 *
 * @param user - The user to insert; its `id` is used as-is, not generated.
 * @throws If the insert fails, e.g. a duplicate `id` or `email`.
 */
export async function insertUser(db: Db, user: User): Promise<void> {
  await db.insert(usersTable).values(user);
}

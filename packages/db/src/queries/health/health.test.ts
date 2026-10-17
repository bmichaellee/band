import { expect, test } from "bun:test";

import type { Db } from "#db";

import { checkDbHealth } from "./health";

// This branch turns a database outage into a 503 report instead of a 500.
test("checkDbHealth resolves to false when the query fails", async () => {
  const db = {
    execute: async () => {
      throw new Error("down");
    },
  } as unknown as Db;
  await expect(checkDbHealth(db)).resolves.toBe(false);
});

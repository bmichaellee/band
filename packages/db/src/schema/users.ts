import type { UserId } from "@band-tools/types";
import { pgTable, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").$type<UserId>().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

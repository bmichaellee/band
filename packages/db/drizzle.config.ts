// drizzle-kit runs outside bun's preload, so load the root .env first.
import "@root/scripts/load-env";
import { serverConfig } from "@band-tools/config/server";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema",
  out: "./drizzle",
  dbCredentials: { url: serverConfig.databaseUrl },
});

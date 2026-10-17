import { fileURLToPath } from "node:url";

// Loads the root .env into process.env without overriding values already set.
try {
  process.loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
} catch {
  // No root .env; fall back to the defaults in @band-tools/config.
}

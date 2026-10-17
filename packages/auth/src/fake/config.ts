import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Local tweaks to the fakes. Copy config.example.jsonc to config.jsonc (gitignored) to override. */
export interface FakeConfig {
  /** How long each redirect page shows before moving on; 0 is a plain 302. */
  redirectSeconds: number;
}

const defaults: FakeConfig = { redirectSeconds: 0 };

function load(): FakeConfig {
  // Tests always get plain 302s, whatever's configured locally.
  if (process.env.NODE_ENV === "test") return { redirectSeconds: 0 };
  try {
    const file = readFileSync(join(import.meta.dir, "config.jsonc"), "utf8");
    return { ...defaults, ...(Bun.JSONC.parse(file) as Partial<FakeConfig>) };
  } catch {
    // No config.jsonc (the usual case, and always in a bundled build): defaults.
    return defaults;
  }
}

export const fakeConfig = load();

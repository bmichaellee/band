import { join } from "node:path";

// Keep this file directly in src/: at runtime it's either src/paths.ts or inlined into
// dist/index.js, both one level below the API package root, so ".." is apps/api either way.
// Code that needs a path relative to the package resolves it from here, at any depth.

/** The API package root (apps/api). */
export const apiRoot = join(import.meta.dir, "..");

/** The built PWA, served at `/` in production. */
export const pwaDist = join(apiRoot, "..", "pwa", "dist");

import { existsSync, statSync } from "node:fs";
import { join, normalize, sep } from "node:path";
import { Elysia } from "elysia";

import { pwaDist } from "#paths";

function fileAt(root: string, path: string): string | undefined {
  try {
    const file = normalize(join(root, decodeURIComponent(path)));
    const insideRoot = file.startsWith(root + sep);
    if (insideRoot && statSync(file, { throwIfNoEntry: false })?.isFile())
      return file;
  } catch {
    // A malformed escape or NUL byte can't name a file.
  }
  return undefined;
}

/**
 * Serves the PWA built into `root` at `/`, falling back to index.html so
 * client-side routes work. Only active once the PWA has been built; in
 * development Vite serves it instead.
 */
export function createWebApp(root: string) {
  const indexHtml = join(root, "index.html");

  return new Elysia({ name: "web" }).get(
    "/*",
    ({ path, status }) => {
      // Unknown API paths must 404, not get the app shell. Keep the prefix in
      // step with the app module's.
      if (path === "/api" || path.startsWith("/api/") || !existsSync(indexHtml))
        return status(404, "Not Found");

      return Bun.file(fileAt(root, path) ?? indexHtml);
    },
    // Not part of the API, so it stays out of the API docs.
    { detail: { hide: true } },
  );
}

export const webApp = createWebApp(pwaDist);

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createWebApp } from "./web";

// A stand-in PWA build, plus a file beside it that must stay out of reach.
const temp = mkdtempSync(join(tmpdir(), "band-web-"));
const root = join(temp, "dist");
const shell = "<!doctype html><title>App</title>";
const appJs = "export {};";
mkdirSync(join(root, "assets"), { recursive: true });
writeFileSync(join(root, "index.html"), shell);
writeFileSync(join(root, "assets", "app.js"), appJs);
writeFileSync(join(temp, "secret.txt"), "secret");
afterAll(() => rmSync(temp, { recursive: true, force: true }));

const web = createWebApp(root);

const get = async (path: string) => {
  const response = await web.handle(new Request(`http://localhost${path}`));
  return { status: response.status, body: await response.text() };
};

describe("createWebApp", () => {
  test("unknown API paths 404 instead of returning the app shell", async () => {
    expect((await get("/api")).status).toBe(404);
    expect((await get("/api/nope")).status).toBe(404);
  });

  test("serves built files, and the app shell for client routes", async () => {
    expect(await get("/assets/app.js")).toEqual({ status: 200, body: appJs });
    expect(await get("/some/page")).toEqual({ status: 200, body: shell });
  });

  test("paths that name no file in the build get the app shell", async () => {
    // Traversal, a malformed escape, a NUL byte, and a near miss of /api.
    for (const path of ["/..%2fsecret.txt", "/%", "/%00", "/apiary"]) {
      const result = await get(path);
      expect({ path, ...result }).toEqual({ path, status: 200, body: shell });
    }
  });
});

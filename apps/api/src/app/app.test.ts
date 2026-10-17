import { expect, test } from "bun:test";
import {
  AuthProviderListSchema,
  HealthSchema,
  UserSchema,
} from "@band-tools/types";

import { app } from "./app";

test("serves the health report at /api/v0/health", async () => {
  // The literal URL: it's the one the PWA and the Docker healthcheck call.
  const response = await app.handle(
    new Request("http://localhost/api/v0/health"),
  );
  // 503 while the database is down, so the test doesn't need it running.
  expect([200, 503]).toContain(response.status);
  const health = HealthSchema.parse(await response.json());
  expect(health.status).toBe(response.status === 200 ? "ok" : "error");
});

const cookieOf = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${name}=`))
    ?.split(";")[0] ?? "";

const me = (cookie?: string) =>
  app.handle(
    new Request("http://localhost/api/v0/me", {
      headers: cookie ? { cookie } : {},
    }),
  );

test("/api/v0/me follows a direct login and logout", async () => {
  expect(await (await me()).json()).toBeNull();

  const login = await app.handle(
    new Request("http://localhost/api/v0/login/fake-direct", {
      method: "POST",
    }),
  );
  expect(login.status).toBe(200);
  UserSchema.parse(await login.json());
  const cookie = cookieOf(login, "session");

  const current = await me(cookie);
  expect(current.status).toBe(200);
  UserSchema.parse(await current.json());

  const logout = await app.handle(
    new Request("http://localhost/api/v0/logout", {
      method: "POST",
      headers: { cookie },
    }),
  );
  expect(logout.status).toBe(204);
  expect(await (await me(cookie)).json()).toBeNull();
});

test("logs in through the redirect flow with the provider named in the path", async () => {
  const start = await app.handle(
    new Request("http://localhost/api/v0/login/fake-redirect"),
  );
  expect(start.status).toBe(302);

  const done = await app.handle(
    new Request(start.headers.get("location") ?? "", {
      headers: { cookie: cookieOf(start, "login_state") },
    }),
  );
  expect(done.status).toBe(302);
  expect((await me(cookieOf(done, "session"))).status).toBe(200);
});

test("answers 404 for a provider that doesn't exist or lacks that login method", async () => {
  const get = (path: string, method = "GET") =>
    app.handle(new Request(`http://localhost/api/v0${path}`, { method }));
  expect((await get("/login/nope")).status).toBe(404);
  expect((await get("/login/fake-redirect", "POST")).status).toBe(404);
  expect((await get("/callback/fake-direct")).status).toBe(404);
});

test("lists the login providers at /api/v0/providers", async () => {
  const response = await app.handle(
    new Request("http://localhost/api/v0/providers"),
  );
  expect(response.status).toBe(200);
  const providers = AuthProviderListSchema.parse(await response.json());
  expect(providers.filter((p) => p.default)).toHaveLength(1);
});

test("logs in with the default provider when /login names none", async () => {
  const login = await app.handle(
    new Request("http://localhost/api/v0/login", { method: "POST" }),
  );
  expect(login.status).toBe(200);
  expect((await me(cookieOf(login, "session"))).status).toBe(200);
});

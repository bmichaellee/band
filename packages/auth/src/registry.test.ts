import { expect, test } from "bun:test";

import { fakeDirectAuth, fakeRedirectAuth } from "./fake";
import { createAuth } from "./registry";

const auth = createAuth(
  { direct: fakeDirectAuth, redirect: fakeRedirectAuth },
  "direct",
);
const request = () => new Request("http://localhost/api/v0/login/x");

test("routes a login to the provider the client asked for", async () => {
  expect((await auth.login("direct", request())).status).toBe(200);
  const redirect = await auth.loginRedirect(
    "redirect",
    request(),
    new URL("http://localhost/api/v0/callback/redirect"),
  );
  expect(redirect.status).toBe(302);
});

test("answers 404 for an unknown provider or a method it lacks", async () => {
  expect((await auth.login("nope", request())).status).toBe(404);
  expect((await auth.login("redirect", request())).status).toBe(404);
  expect((await auth.callback("direct", request())).status).toBe(404);
  // Inherited object keys aren't providers.
  expect((await auth.login("constructor", request())).status).toBe(404);
});

test("authenticates and logs out through the provider that owns the session", async () => {
  const login = await auth.login("direct", request());
  const cookie = login.headers.getSetCookie()[0]?.split(";")[0] ?? "";
  const withCookie = () =>
    new Request("http://localhost/", { headers: { cookie } });

  expect(await auth.authenticate(withCookie())).not.toBeNull();
  await auth.logout(withCookie());
  expect(await auth.authenticate(withCookie())).toBeNull();
});

test("lists each provider with its login methods and the default", () => {
  expect(auth.list()).toEqual([
    { id: "direct", default: true },
    { id: "redirect", redirect: true, default: false },
  ]);
});

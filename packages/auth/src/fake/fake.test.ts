import { expect, test } from "bun:test";
import { UserSchema } from "@band-tools/types";

import { fakeDirectAuth, fakeRedirectAuth } from "./fake";

const url = "http://localhost/api/v0/login/x";
const callbackUrl = new URL("http://localhost/api/v0/callback/x");

const cookieOf = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${name}=`))
    ?.split(";")[0] ?? "";

test("a direct login lasts until logout", async () => {
  const login = await fakeDirectAuth.login?.(
    new Request(url, { method: "POST" }),
  );
  const user = UserSchema.parse(await login?.json());
  const cookie = cookieOf(login as Response, "session");
  const withCookie = () => new Request(url, { headers: { cookie } });

  expect(await fakeDirectAuth.authenticate(withCookie())).toEqual(user);
  await fakeDirectAuth.logout(withCookie());
  expect(await fakeDirectAuth.authenticate(withCookie())).toBeNull();
});

test("a redirect login round-trips through the callback", async () => {
  const start = await fakeRedirectAuth.loginRedirect?.(
    new Request(url),
    callbackUrl,
  );
  expect(start?.status).toBe(302);
  const back = start?.headers.get("location") ?? "";
  expect(new URL(back).pathname).toBe(callbackUrl.pathname);

  const done = await fakeRedirectAuth.callback?.(
    new Request(back, {
      headers: { cookie: cookieOf(start as Response, "login_state") },
    }),
  );
  expect(done?.status).toBe(302);
  const cookie = cookieOf(done as Response, "session");
  expect(
    await fakeRedirectAuth.authenticate(
      new Request(url, { headers: { cookie } }),
    ),
  ).not.toBeNull();
});

test("a callback whose state doesn't match is rejected", async () => {
  const response = await fakeRedirectAuth.callback?.(
    new Request("http://localhost/callback?code=fake-code&state=forged", {
      headers: { cookie: "login_state=other" },
    }),
  );
  expect(response?.status).toBe(400);
});

test("each provider only recognizes its own sessions", async () => {
  const login = await fakeDirectAuth.login?.(new Request(url));
  const cookie = cookieOf(login as Response, "session");
  const request = new Request(url, { headers: { cookie } });
  expect(await fakeRedirectAuth.authenticate(request)).toBeNull();
});

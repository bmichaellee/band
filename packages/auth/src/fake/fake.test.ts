import { expect, test } from "bun:test";

import { fakeDirectAuth, fakeRedirectAuth } from "./fake";

const url = "http://localhost/api/v0/login/x";

const cookieOf = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${name}=`))
    ?.split(";")[0] ?? "";

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

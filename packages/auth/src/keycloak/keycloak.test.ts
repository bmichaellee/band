import { expect, test } from "bun:test";
import { type User, UserIdSchema } from "@band-tools/types";

import { createKeycloakAuth } from "./keycloak";

const keycloak = createKeycloakAuth({
  issuer: "http://auth.test/realms/r",
  internalUrl: "http://keycloak.internal/realms/r",
  clientId: "app",
  clientSecret: "secret",
});
const callbackUrl = new URL("http://app.test/api/v0/callback/keycloak");
const user: User = {
  id: UserIdSchema.parse("fake-user-00000000000"),
  name: "Fake User",
  email: "fake@example.com",
};

// The `name=value` pairs a response sets, as a request's cookie header.
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

test("a login comes back through the callback as a session for the Keycloak user", async () => {
  const start = await keycloak.loginRedirect(
    new Request(callbackUrl),
    callbackUrl,
  );
  const authorize = new URL(start.headers.get("location") ?? "");
  expect(authorize.origin + authorize.pathname).toBe(
    "http://auth.test/realms/r/protocol/openid-connect/auth",
  );

  // Keycloak's back channel: the token exchange, then userinfo.
  const calls: string[] = [];
  globalThis.fetch = (async (input: string) => {
    calls.push(input);
    return input.endsWith("/token")
      ? Response.json({ access_token: "at", refresh_token: "rt" })
      : Response.json({ sub: user.id, name: user.name, email: user.email });
  }) as typeof fetch;

  const back = new URL(callbackUrl);
  back.search = `code=abc&state=${authorize.searchParams.get("state")}`;
  const done = await keycloak.callback(
    new Request(back, { headers: { cookie: cookiesOf(start) } }),
  );
  expect(done.status).toBe(302);
  expect(calls[0]).toStartWith("http://keycloak.internal/");

  const later = new Request(callbackUrl, {
    headers: { cookie: cookiesOf(done) },
  });
  expect(await keycloak.authenticate(later)).toEqual(user);
});

test("a callback whose state doesn't match is rejected", async () => {
  const response = await keycloak.callback(
    new Request(`${callbackUrl}?code=abc&state=forged`, {
      headers: { cookie: "keycloak_state=other; keycloak_verifier=v" },
    }),
  );
  expect(response.status).toBe(400);
});

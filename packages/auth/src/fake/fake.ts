import { type User, UserIdSchema } from "@band-tools/types";

import type { DirectAuthProvider, RedirectAuthProvider } from "../auth";
import { createSessionStore, readCookie, setCookie } from "../sessions";
import { fakeConfig } from "./config";
// As text so the API's bundled build inlines it.
import redirectPage from "./redirect.html" with { type: "text" };

const FAKE_USER: User = {
  id: UserIdSchema.parse("fake-user-00000000000"),
  name: "Fake User",
  email: "fake@example.com",
};

const STATE_COOKIE = "login_state";
const STATE_TTL_SECONDS = 300;
const FAKE_CODE = "fake-code";

// Each redirect can be a visible page that waits before moving on, standing in
// for an identity provider's screens (see config.ts).
function redirect(location: URL | string, cookies: string[]) {
  const headers = new Headers();
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  if (!fakeConfig.redirectSeconds) {
    headers.set("location", String(location));
    return new Response(null, { status: 302, headers });
  }
  headers.set("content-type", "text/html; charset=utf-8");
  // bun-types types every .html import as an HTMLBundle; `type: "text"` makes it a string.
  const page = (redirectPage as unknown as string)
    .replaceAll("{{seconds}}", String(fakeConfig.redirectSeconds))
    .replaceAll("{{to}}", Bun.escapeHTML(String(location)));
  return new Response(page, { headers });
}

// What both fakes share: a user behind an in-memory session, and logout.
function fakeSessions() {
  const sessions = createSessionStore<User>();
  return {
    sessions,
    authenticate: async (request: Request) => sessions.get(request) ?? null,
    logout: async (request: Request) =>
      new Response(null, {
        status: 204,
        headers: { "set-cookie": sessions.end(request) },
      }),
  };
}

/** Placeholder for credential logins: approves every login as one fixed user. Not for production. */
export const fakeDirectAuth: DirectAuthProvider = (() => {
  const { sessions, ...shared } = fakeSessions();
  return {
    ...shared,
    login: async () =>
      Response.json(FAKE_USER, {
        headers: { "set-cookie": sessions.start(FAKE_USER) },
      }),
  };
})();

/**
 * Placeholder for redirect logins: mimics an OIDC authorization-code flow
 * without an identity provider. `loginRedirect` sends the user straight to the
 * callback with a code and the state it remembered in a cookie; `callback`
 * checks both before starting a session. Not for production.
 */
export const fakeRedirectAuth: RedirectAuthProvider = (() => {
  const { sessions, ...shared } = fakeSessions();
  return {
    ...shared,
    redirect: true,
    loginRedirect: async (_request, callbackUrl) => {
      const state = crypto.randomUUID();
      const back = new URL(callbackUrl);
      back.search = new URLSearchParams({ code: FAKE_CODE, state }).toString();
      return redirect(back, [
        setCookie(STATE_COOKIE, state, STATE_TTL_SECONDS),
      ]);
    },
    callback: async (request) => {
      const params = new URL(request.url).searchParams;
      const expected = readCookie(request, STATE_COOKIE);
      if (
        params.get("code") !== FAKE_CODE ||
        !expected ||
        params.get("state") !== expected
      ) {
        return new Response("Invalid login callback", { status: 400 });
      }
      return redirect("/", [
        sessions.start(FAKE_USER),
        setCookie(STATE_COOKIE, "", 0),
      ]);
    },
  };
})();

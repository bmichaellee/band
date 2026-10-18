import { type User, UserSchema } from "@band-tools/types";

import type { RedirectAuthProvider } from "../auth";
import { createSessionStore, readCookie, setCookie } from "../sessions";

export interface KeycloakConfig {
  /** The realm's URL as browsers reach it, e.g. `https://example.com/auth/realms/band-tools`. */
  issuer: string;
  /** The same realm as this server reaches it; may differ from `issuer` (e.g. inside a container network). */
  internalUrl: string;
  clientId: string;
  clientSecret: string;
}

interface KeycloakSession {
  user: User;
  /** Lets logout end Keycloak's own session too. */
  refreshToken: string;
}

const STATE_COOKIE = "keycloak_state";
const VERIFIER_COOKIE = "keycloak_verifier";
const LOGIN_TTL_SECONDS = 300;

const randomToken = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");

const pkceChallenge = async (verifier: string) =>
  Buffer.from(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  ).toString("base64url");

/**
 * Logs in through a Keycloak realm with the OIDC authorization-code flow and
 * PKCE. Keycloak checks the credentials; the callback then asks it who logged
 * in (userinfo) and starts a session here.
 *
 * Until users are stored, the Keycloak user's id (`sub`) must itself be a
 * valid user id; the compose stack's realm seeds one such user.
 */
export function createKeycloakAuth(
  config: KeycloakConfig,
): RedirectAuthProvider {
  const sessions = createSessionStore<KeycloakSession>();
  const endpoint = (base: string, name: string) =>
    `${base}/protocol/openid-connect/${name}`;
  const client = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
  };
  const rejected = (reason: string) => new Response(reason, { status: 400 });

  return {
    redirect: true,
    authenticate: async (request) => sessions.get(request)?.user ?? null,

    loginRedirect: async (_request, callbackUrl) => {
      const state = randomToken();
      const verifier = randomToken();
      const url = new URL(endpoint(config.issuer, "auth"));
      url.search = new URLSearchParams({
        client_id: config.clientId,
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: String(callbackUrl),
        state,
        code_challenge: await pkceChallenge(verifier),
        code_challenge_method: "S256",
      }).toString();
      const headers = new Headers({ location: String(url) });
      headers.append(
        "set-cookie",
        setCookie(STATE_COOKIE, state, LOGIN_TTL_SECONDS),
      );
      headers.append(
        "set-cookie",
        setCookie(VERIFIER_COOKIE, verifier, LOGIN_TTL_SECONDS),
      );
      return new Response(null, { status: 302, headers });
    },

    callback: async (request) => {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");
      const state = readCookie(request, STATE_COOKIE);
      const verifier = readCookie(request, VERIFIER_COOKIE);
      if (
        !code ||
        !state ||
        !verifier ||
        url.searchParams.get("state") !== state
      )
        return rejected("Invalid login callback");

      // The token request must repeat the login's redirect_uri: this URL
      // without the query Keycloak added.
      url.search = "";
      const tokenResponse = await fetch(endpoint(config.internalUrl, "token"), {
        method: "POST",
        body: new URLSearchParams({
          ...client,
          grant_type: "authorization_code",
          code,
          redirect_uri: String(url),
          code_verifier: verifier,
        }),
      });
      if (!tokenResponse.ok) return rejected("Login was not accepted");
      const tokens = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token: string;
      };

      const userinfo = await fetch(endpoint(config.internalUrl, "userinfo"), {
        headers: { authorization: `Bearer ${tokens.access_token}` },
      });
      if (!userinfo.ok) return rejected("Login was not accepted");
      const claims = (await userinfo.json()) as Record<string, unknown>;
      const user = UserSchema.safeParse({
        id: claims.sub,
        name: claims.name,
        email: claims.email,
      });
      if (!user.success)
        return new Response("No user for this Keycloak account", {
          status: 403,
        });

      const headers = new Headers({ location: "/" });
      headers.append(
        "set-cookie",
        sessions.start({ user: user.data, refreshToken: tokens.refresh_token }),
      );
      headers.append("set-cookie", setCookie(STATE_COOKIE, "", 0));
      headers.append("set-cookie", setCookie(VERIFIER_COOKIE, "", 0));
      return new Response(null, { status: 302, headers });
    },

    logout: async (request) => {
      const session = sessions.get(request);
      const cookie = sessions.end(request);
      // Ends Keycloak's session too, so the next login asks for credentials
      // again. Best effort: the session here has ended either way.
      if (session) {
        await fetch(endpoint(config.internalUrl, "logout"), {
          method: "POST",
          body: new URLSearchParams({
            ...client,
            refresh_token: session.refreshToken,
          }),
        }).catch(() => {
          // Keycloak unreachable: its session lapses on its own timeout.
        });
      }
      return new Response(null, {
        status: 204,
        headers: { "set-cookie": cookie },
      });
    },
  };
}

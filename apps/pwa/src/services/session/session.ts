import { clientConfig } from "@band-tools/config/client";
import type {
  AuthProviderInfo,
  LoginCredentials,
  User,
} from "@band-tools/types";

const sessionUrl = (path: string) => `${clientConfig.apiBaseUrl}/v0${path}`;

/** Outcome of a direct login: the user, or the API refused the credentials. */
export type LoginResult = { kind: "ok"; user: User } | { kind: "rejected" };

function ensureOk(response: Response, action: string) {
  if (!response.ok) {
    throw new Error(
      `${action} failed: ${response.status} ${response.statusText}`,
    );
  }
  return response;
}

/** Lists the ways to log in, so the login UI can offer them. */
export async function getProviders(
  signal?: AbortSignal,
): Promise<AuthProviderInfo[]> {
  const response = await fetch(sessionUrl("/providers"), { signal });
  return ensureOk(response, "Listing providers").json();
}

/**
 * Logs in directly with credentials. A 401 is a refusal and resolves as
 * `rejected`, since a wrong password is an outcome the form shows; other
 * failures throw.
 */
export async function login(
  provider: string,
  credentials: LoginCredentials,
  signal?: AbortSignal,
): Promise<LoginResult> {
  const response = await fetch(
    sessionUrl(`/login/${encodeURIComponent(provider)}`),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials),
      signal,
    },
  );
  if (response.status === 401) return { kind: "rejected" };
  const user: User = await ensureOk(response, "Login").json();
  return { kind: "ok", user };
}

/**
 * The URL that starts a redirect login. It's a page navigation, not a fetch:
 * the identity provider's login screen has to load in the browser.
 */
export function redirectLoginUrl(provider: string): string {
  return sessionUrl(`/login/${encodeURIComponent(provider)}`);
}

/** The logged-in user, or `null` when there's no session. */
export async function getCurrentUser(
  signal?: AbortSignal,
): Promise<User | null> {
  const response = await fetch(sessionUrl("/me"), { signal });
  return ensureOk(response, "Loading the current user").json();
}

/** Ends the current session. */
export async function logout(signal?: AbortSignal): Promise<void> {
  const response = await fetch(sessionUrl("/logout"), {
    method: "POST",
    signal,
  });
  ensureOk(response, "Logout");
}

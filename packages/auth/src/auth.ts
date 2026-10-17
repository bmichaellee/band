import type { User } from "@band-tools/types";

/**
 * What one way of logging in must provide. A real implementation (OAuth, OIDC,
 * sessions, a hosted service) replaces a fake by satisfying this.
 *
 * Everything uses the standard `Request`/`Response`, so it stays independent of
 * any web framework. Actions return the whole `Response` (status, redirect,
 * several cookies, body) and the API sends it as is.
 *
 * A provider is either direct or redirect, never both: a service that supports
 * both is registered as two providers. Asking a provider for the other kind of
 * login is a 404.
 */
export type AuthProvider = DirectAuthProvider | RedirectAuthProvider;

interface BaseAuthProvider {
  /** Resolves the user behind a request, or `null` when this provider has no session for it. */
  authenticate(request: Request): Promise<User | null>;
  /** Ends the session behind a request; may redirect to the provider's own logout. */
  logout(request: Request): Promise<Response>;
}

/** Logs in from credentials sent with the request. */
export interface DirectAuthProvider extends BaseAuthProvider {
  redirect?: false;
  /** Direct login from a request's credentials: answers with the user or a rejection. */
  login(request: Request): Promise<Response>;
}

/** Logs in by sending the user through an external identity provider and back. */
export interface RedirectAuthProvider extends BaseAuthProvider {
  redirect: true;
  /**
   * Starts a redirect login: answers with a redirect to an external identity
   * provider, telling it to return to `callbackUrl`.
   */
  loginRedirect(request: Request, callbackUrl: URL): Promise<Response>;
  /** Where the identity provider sends the user back to finish a redirect login. */
  callback(request: Request): Promise<Response>;
}

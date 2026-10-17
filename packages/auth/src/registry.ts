import type { AuthProviderInfo, User } from "@band-tools/types";

import type { AuthProvider } from "./auth";

const notFound = () => new Response("Not Found", { status: 404 });

/**
 * Routes requests to one of several providers by the id the client asked for
 * (`login`, `loginRedirect`, `callback`), and finds the right one again for
 * requests that carry a session (`authenticate`, `logout`). An unknown id, or a
 * login method the provider doesn't offer, is a 404.
 *
 * `defaultProvider` is the id to use when the client doesn't name one.
 */
export function createAuth<P extends Record<string, AuthProvider>>(
  providers: P,
  defaultProvider: keyof P & string,
) {
  const find = (id: string) =>
    Object.hasOwn(providers, id) ? providers[id] : undefined;
  const findDirect = (id: string) => {
    const provider = find(id);
    return provider && !provider.redirect ? provider : undefined;
  };
  const findRedirect = (id: string) => {
    const provider = find(id);
    return provider?.redirect ? provider : undefined;
  };

  async function sessionProvider(request: Request) {
    for (const provider of Object.values(providers)) {
      if (await provider.authenticate(request)) return provider;
    }
  }

  return {
    defaultProvider,
    /** What can be logged into, and how, for clients to choose from. */
    list(): AuthProviderInfo[] {
      return Object.entries(providers).map(([id, provider]) => ({
        id,
        ...(provider.redirect && { redirect: true }),
        default: id === defaultProvider,
      }));
    },
    /** Resolves the user behind a request from whichever provider started its session. */
    async authenticate(request: Request): Promise<User | null> {
      const provider = await sessionProvider(request);
      return (await provider?.authenticate(request)) ?? null;
    },
    async login(id: string, request: Request): Promise<Response> {
      return (await findDirect(id)?.login(request)) ?? notFound();
    },
    async loginRedirect(
      id: string,
      request: Request,
      callbackUrl: URL,
    ): Promise<Response> {
      return (
        (await findRedirect(id)?.loginRedirect(request, callbackUrl)) ??
        notFound()
      );
    },
    async callback(id: string, request: Request): Promise<Response> {
      return (await findRedirect(id)?.callback(request)) ?? notFound();
    },
    /** Ends the session with the provider that started it; nothing to end is not an error. */
    async logout(request: Request): Promise<Response> {
      const provider = await sessionProvider(request);
      return provider
        ? provider.logout(request)
        : new Response(null, { status: 204 });
    },
  };
}

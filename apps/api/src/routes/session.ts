import { auth } from "@band-tools/auth";
import { AuthProviderListSchema } from "@band-tools/types";
import { Elysia } from "elysia";

// Thin on purpose: the auth package decides who gets in and builds the whole
// response (user, rejection, redirect to an identity provider, cookies). The
// provider is whichever the client named in the path, else the default.

// Where an identity provider returns the user: the callback route for that
// provider, whether or not the login path named one.
const callbackUrl = (request: Request, provider: string) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(
    /\/login(\/.*)?$/,
    `/callback/${encodeURIComponent(provider)}`,
  );
  url.search = "";
  return url;
};

const loginRedirect = (request: Request, provider?: string) => {
  const id = provider ?? auth.defaultProvider;
  return auth.loginRedirect(id, request, callbackUrl(request, id));
};

const login = (request: Request, provider?: string) =>
  auth.login(provider ?? auth.defaultProvider, request);

const callback = (request: Request, provider: string) =>
  auth.callback(provider, request);

// A path without a provider is the same route as the one with it; it's hidden
// from the docs (the optional-parameter form would list every route twice).
const hidden = { detail: { hide: true } };

export const sessionRoutes = new Elysia({
  name: "routes/session",
  tags: ["Session"],
})
  .get("/providers", () => auth.list(), {
    detail: {
      summary: "Login providers",
      description:
        "Lists the ways to login, so a client can offer them. Names the one used when a login path has no provider.",
    },
    response: { 200: AuthProviderListSchema },
  })
  .get(
    "/callback/:provider",
    ({ request, params }) => callback(request, params.provider),
    {
      detail: {
        summary: "Login callback",
        description:
          "Where an external identity provider returns the user to finish a redirect login. Also accepts POST for providers that use a form post.",
      },
    },
  )
  .get(
    "/login/:provider",
    ({ request, params }) => loginRedirect(request, params.provider),
    {
      detail: {
        summary: "Login via redirect",
        description:
          "Begins a login by redirecting to an external identity provider (Google, Keycloak, ...), which returns to the callback. Without a provider in the path, uses the default one.",
      },
    },
  )
  .post(
    "/login/:provider",
    ({ request, params }) => login(request, params.provider),
    {
      detail: {
        summary: "Login",
        description:
          "Logs in directly with the credentials the chosen provider expects. Without a provider in the path, uses the default one.",
      },
    },
  )
  .post("/logout", ({ request }) => auth.logout(request), {
    detail: { summary: "Log out", description: "Ends the current session." },
  })
  .get("/login", ({ request }) => loginRedirect(request), hidden)
  .post("/login", ({ request }) => login(request), hidden)
  .post(
    "/callback/:provider",
    ({ request, params }) => callback(request, params.provider),
    hidden,
  );

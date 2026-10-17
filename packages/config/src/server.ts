// Server-only configuration, read from environment variables. Never import this in client code.

const production = process.env.NODE_ENV === "production";
const keycloakIssuer = process.env.KEYCLOAK_ISSUER;

export const serverConfig = {
  port: Number(process.env.API_PORT ?? 47392),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/band-tools",
  /** Serve the OpenAPI docs at /api/docs. Off in production. */
  docs: !production,
  /**
   * The Keycloak login provider, offered only when an issuer is set (the
   * compose stack sets one). `issuer` is the realm's URL as browsers reach it;
   * `internalUrl` is the same realm as this server reaches it, when that
   * differs (in compose, over the private network).
   */
  keycloak: keycloakIssuer
    ? {
        issuer: keycloakIssuer,
        internalUrl: process.env.KEYCLOAK_INTERNAL_URL ?? keycloakIssuer,
        clientId: process.env.KEYCLOAK_CLIENT_ID ?? "band-tools",
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      }
    : undefined,
} as const;

export type ServerConfig = typeof serverConfig;

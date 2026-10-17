// Server-only configuration, read from environment variables. Never import this in client code.

const production = process.env.NODE_ENV === "production";

export const serverConfig = {
  port: Number(process.env.API_PORT ?? 47392),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/band-tools",
  /** Serve the OpenAPI docs at /api/docs. Off in production. */
  docs: !production,
} as const;

export type ServerConfig = typeof serverConfig;

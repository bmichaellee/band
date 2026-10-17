// Browser-safe configuration. Everything here ships to the client, so no secrets.

export const clientConfig = {
  appName: "Band Tools",
  apiBaseUrl: "/api",
} as const;

export type ClientConfig = typeof clientConfig;

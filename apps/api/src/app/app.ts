import { getVersion } from "@band-tools/config";
import { clientConfig } from "@band-tools/config/client";
import { serverConfig } from "@band-tools/config/server";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { healthRoutes } from "../routes/health";
import { webApp } from "../web";

const v0 = new Elysia({ prefix: "/v0" }).use(healthRoutes);

// Docs stay outside the version prefix: one URL for every version.
const api = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      enabled: serverConfig.docs,
      path: "/docs",
      documentation: {
        info: { title: `${clientConfig.appName} API`, version: getVersion() },
      },
    }),
  )
  .use(v0);

export const app = new Elysia().use(api).use(webApp);

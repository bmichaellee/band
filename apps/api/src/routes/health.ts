import { checkDbHealth } from "@band-tools/db";
import { type Health, HealthSchema } from "@band-tools/types";
import { Elysia } from "elysia";

import { db } from "#db";

export const healthRoutes = new Elysia({ name: "routes/health" }).get(
  "/health",
  async ({ status }) => {
    const started = performance.now();
    const connected = await checkDbHealth(db);
    const body: Health = {
      status: connected ? "ok" : "error",
      db: { connected, latencyMs: Math.round(performance.now() - started) },
    };
    return connected ? body : status(503, body);
  },
  {
    detail: {
      summary: "Health check",
      description: "Reports whether the database is reachable.",
    },
    response: { 200: HealthSchema, 503: HealthSchema },
  },
);

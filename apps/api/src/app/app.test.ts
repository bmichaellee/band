import { expect, test } from "bun:test";
import { HealthSchema } from "@band-tools/types";

import { app } from "./app";

test("serves the health report at /api/v0/health", async () => {
  // The literal URL: it's the one the PWA and the Docker healthcheck call.
  const response = await app.handle(
    new Request("http://localhost/api/v0/health"),
  );
  // 503 while the database is down, so the test doesn't need it running.
  expect([200, 503]).toContain(response.status);
  const health = HealthSchema.parse(await response.json());
  expect(health.status).toBe(response.status === 200 ? "ok" : "error");
});

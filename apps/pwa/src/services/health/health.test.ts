import { describe, expect, mock, test } from "bun:test";
import type { Health } from "@band-tools/types";

import { getHealth } from "./health";

function respondWith(status: number, body: unknown = {}) {
  globalThis.fetch = mock(async () =>
    Response.json(body, { status }),
  ) as unknown as typeof fetch;
}

describe("getHealth", () => {
  test("returns the report, including a 503 one", async () => {
    const report: Health = {
      status: "error",
      db: { connected: false, latencyMs: 1 },
    };
    respondWith(503, report);
    expect(await getHealth()).toEqual(report);
  });

  test("throws on other failures", async () => {
    respondWith(500);
    await expect(getHealth()).rejects.toThrow("Health check failed: 500");
  });
});

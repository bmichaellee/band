import { describe, expect, mock, test } from "bun:test";

import { login } from "./session";

function respondWith(status: number, body: unknown = {}) {
  globalThis.fetch = mock(async () =>
    Response.json(body, { status }),
  ) as unknown as typeof fetch;
}

describe("login", () => {
  test("resolves as rejected on 401", async () => {
    respondWith(401, { error: "Unauthorized" });
    expect(await login("fake", { username: "a", password: "b" })).toEqual({
      kind: "rejected",
    });
  });

  test("throws on other failures", async () => {
    respondWith(500);
    await expect(
      login("fake", { username: "a", password: "b" }),
    ).rejects.toThrow("Login failed: 500");
  });
});

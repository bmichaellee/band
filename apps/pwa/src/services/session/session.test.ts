import { describe, expect, mock, test } from "bun:test";
import type { User } from "@band-tools/types";

import { getCurrentUser, login } from "./session";

function respondWith(status: number, body: unknown = {}) {
  globalThis.fetch = mock(async () =>
    Response.json(body, { status }),
  ) as unknown as typeof fetch;
}

const user: User = {
  id: "fake-user-00000000000" as User["id"],
  name: "Fake User",
  email: "fake@example.com",
};

describe("getCurrentUser", () => {
  test("is null without a session", async () => {
    respondWith(200, null);
    expect(await getCurrentUser()).toBeNull();
  });
});

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

  test("returns the user on success", async () => {
    respondWith(200, user);
    expect(await login("fake", { username: "a", password: "b" })).toEqual({
      kind: "ok",
      user,
    });
  });
});

import { expect, test } from "bun:test";

import { fakeDirectAuth, fakeRedirectAuth } from "./fake";
import { createAuth } from "./registry";

const auth = createAuth(
  { direct: fakeDirectAuth, redirect: fakeRedirectAuth },
  "direct",
);
const request = () => new Request("http://localhost/api/v0/login/x");

test("answers 404 for an unknown provider or a method it lacks", async () => {
  expect((await auth.login("nope", request())).status).toBe(404);
  expect((await auth.login("redirect", request())).status).toBe(404);
  expect((await auth.callback("direct", request())).status).toBe(404);
  // Inherited object keys aren't providers.
  expect((await auth.login("constructor", request())).status).toBe(404);
});

test("lists each provider with its login methods and the default", () => {
  expect(auth.list()).toEqual([
    { id: "direct", default: true },
    { id: "redirect", redirect: true, default: false },
  ]);
});

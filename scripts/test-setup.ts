// Preloaded once per `bun test` run (bunfig.toml [test].preload); all test
// files share these globals.
import { afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Guard: a test that starts the API gets a free port, never the dev server's.
process.env.API_PORT = "0";

// A browser-like DOM (happy-dom) for the PWA's React tests. happy-dom also swaps in its
// own networking, encoding and timer globals; put Bun's back so server code (and fetch
// mocks) behave exactly as they do at runtime. React only needs the DOM parts.
const keep = [
  "fetch",
  "Request",
  "Response",
  "Headers",
  "FormData",
  "Blob",
  "File",
  "URL",
  "URLSearchParams",
  "AbortController",
  "AbortSignal",
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "TextEncoder",
  "TextDecoder",
  "WebSocket",
  "crypto",
  "performance",
  "structuredClone",
  "queueMicrotask",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
] as const;
const bunGlobals = Object.fromEntries(
  keep.map((name) => [name, globalThis[name]]),
);
GlobalRegistrator.register({ url: "http://localhost/" });
Object.assign(globalThis, bunGlobals);

// After every test, put Bun's web globals back and clear localStorage, so one
// test's fetch mock or saved theme can't leak into the next.
afterEach(() => {
  Object.assign(globalThis, bunGlobals);
  localStorage.clear();
});

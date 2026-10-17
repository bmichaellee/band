---
name: writing-tests
description: Use when writing or fixing tests, or when coverage output looks wrong.
---

# Writing tests

- **Run `bun test` from the repo root**; pass a path to narrow it (`bun test apps/pwa`). Bun reads only the working directory's `bunfig.toml`, so from an app folder the test preload and coverage settings don't apply, and React tests fail with `document is not defined`.
- **No real services needed:** tests must pass without a database or running servers. Mock `fetch`, pass fake clients, or assert on behavior that holds either way (e.g. a health route returns 200 *or* 503 with a valid report).
- **Make it testable by injection:** code that touches files, a database or a process takes it as a parameter, with a default instance exported beside the factory (`createWebApp(root)` / `webApp`). Tests pass a temporary folder (`mkdtempSync`, removed in `afterAll`) or a fake.
- **React tests** get a happy-dom page from the test preload. Query within the render's `container` (`within(container)`), not `screen` or `render`'s own queries, which see the whole document, including other tests' leftovers.
- **Globals:** after every test the preload restores Bun's web globals (`fetch`, timers, …) and clears `localStorage`, so set mocks inside each test (one set in `beforeAll` is undone after the first test). Restore anything else you replace.
- **Wrap code that triggers React updates outside Testing Library** in `act`.
- **Coverage quirk:** Bun can mark a line inside a never-called function as covered. Trust the function count over a lone green line.

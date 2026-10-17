---
name: api-endpoints
description: Use when adding or changing an API route, its request/response shapes, or how the PWA calls it.
---

# API endpoints

- **Shapes live in the types package as Zod schemas**, shared by both sides. The API passes them to the route (`body`, `query`, `response` per status) so they validate and generate the OpenAPI docs; the PWA imports the inferred type for its calls. Don't redefine a shape on either side.
- **A route is an Elysia plugin in its own module**, named after its module path (`new Elysia({ name: "routes/x" })`, which also lets Elysia deduplicate it) and exported as `xRoutes`. It's mounted on the versioned group in the API's app module. New versions get a new group rather than changing an existing one.
- **Docs text:** a route's comes from its `detail`, a field's from `.meta({ description })`; JSDoc on a schema field only reaches editor hovers. Routes that aren't part of the API set `detail: { hide: true }`.
- **Return non-2xx outcomes the client can act on with `status(code, body)`** and declare that status in `response`, so it's typed and documented. A response that still carries a body (like a 503 health report) is a result, not an exception, on the PWA side.
- **Telling API paths from app paths:** match `/api` or `/api/…` at a segment boundary, never a bare `"/api"` prefix (`/apiary` is a client route).
- **Paths relative to the API package** (e.g. to the built PWA) come from the API's paths module, never from `import.meta.dir` in a nested file: nested files sit at a different depth than the bundle.
- **Check it:** add a case to the app module's test that calls `app.handle(new Request(...))` at the route's full, literal path (the URL the PWA uses), which also catches a broken mount or prefix; routes themselves stay flat, without a test beside them. Then look at the route in the docs page in development.

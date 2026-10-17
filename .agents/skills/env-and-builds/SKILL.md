---
name: env-and-builds
description: Use when changing environment variables or config, the API build, the Docker image or compose stack.
---

# Environment and builds

- **One `.env` at the repo root** for every app and script; keep `.env.example` in step (placeholders, never real secrets). Bun's preload loads it only where the working directory's `bunfig.toml` lists it; tools that run under Node (Vite's config, drizzle-kit) load it themselves.
- **Configs that run under Node** (and what they import) use only Node-portable APIs (`process.loadEnvFile`, `fileURLToPath(new URL(…, import.meta.url))`), never Bun globals or `import.meta.dir`. The Vite config can't import workspace packages (Node can't load their extensionless TS), so values it shares with app code are copied as literals.
- **Only the config package reads the environment**, each variable once, with a development default so the repo runs without a `.env`; app code uses `serverConfig`/`clientConfig`. Server-only config must never be imported by browser code; browser-safe values go in the config package's client entry.
- **`bun --watch` keeps the old environment across restarts.** After changing `.env`, stop and restart the dev server.
- **Bun inlines `process.env.NODE_ENV` when bundling.** The bundle sees the build-time value unless the build script `define`s it, so production-only behavior must be set there, not only in the container's environment.
- **Handle SIGINT and SIGTERM** in long-running processes: in the container, bun is PID 1, which ignores signals it has no handler for, so `docker stop` waits and then force-kills.
- **The production image** contains only build output. Anything the bundle reads at runtime (like the built PWA) has to be copied into the same relative layout.
- **Check it:** build and run the production stack locally and hit it on its one published port; confirm what should be off in production (e.g. docs) is off.

---
name: restructuring
description: Use when moving, renaming or splitting files, turning a module into a folder (or back into a file), adding an import alias, or adding a workspace or dependency.
---

# Restructuring code

- **Turning a module into a folder, or back into a file once it's down to one module:** move `x.ts` ↔ `x/x.ts` and add or delete `x/index.ts` (`export * from "./x";`). Then fix the relative imports inside the moved file and any `package.json` `exports`/`imports` entry or `/// <reference>` that names its path. Importers of `./x` keep working.
- **Adding an alias folder** (`#name` in `package.json` `imports`): also add a `noRestrictedImports` block for it in `biome.json`, so files inside can't import the folder's own barrel.
- **Adding a workspace or dependency:** a workspace is `@band-tools/<folder>`, private, ESM and `UNLICENSED`, with no version of its own; libraries export their TS source, apps use only `#` imports. Installs are isolated, so declare every package a workspace imports (siblings as `workspace:*`) even when a sibling already has it; root `scripts/` can only use root dependencies.
- **Files at the repo root** are out of reach of a package's `imports`; tooling and config files reach them through the root tsconfig's `@root/*` path. Keep it out of app and package source: Vite doesn't resolve tsconfig paths, and a folder whose own `tsconfig.json` doesn't extend the root one can't see it.
- **Running dev servers cache old paths.** After moving files, Vite and `bun --watch` may keep serving the old resolution (blank page, or "does not provide an export"). Re-save the importing files, usually the barrels, or restart the server. Check what Vite serves with `curl <dev-url>/src/<file>`.
- **Don't overwrite watched files with shell redirection** (`cat > file`): a watcher can pick up the empty, half-written file. Write to a temporary file and `mv` it into place.
- **Afterwards:** run `bun run check` and `bun test`, and load the app in the browser.

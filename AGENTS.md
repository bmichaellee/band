# AGENTS.md

How to work in this repo, for anyone changing it: people and coding agents alike.

For what exists and what state it's in, read the code: each workspace's
`package.json` (scripts, exports, `imports` aliases) and its entry file; the
root `package.json` for repo-wide commands; `.env.example` for configuration.

## Layout

1. **Tests sit next to what they test**, each test file covering one source file: `health.ts` → `health.test.ts`.
2. **A module with more than one file becomes a folder with an `index.ts` barrel**, e.g. `health/{health.ts, health.test.ts, index.ts}`. Importers still import `./health`. Single-file modules stay flat.
3. **When an import reaches `../../`, consider an alias**: an `"imports"` entry in that package's `package.json` (`#name`). Use judgment; a deep relative path is fine where an alias would be awkward.
4. **Aliases:** from outside an aliased folder or file, import through its `#name`, even from one level up; inside it, import siblings relatively (`./Foo`), never through the folder's own barrel.
5. **Packages are used only through their public entry points** (`exports` in `package.json`), never by reaching into another package's `src/`.
6. **Entry files stay minimal**: an app's or package's entry file only starts, mounts, stops or re-exports; composition lives in modules.

## Code

- Comments are brief and explain *why*, matching the surrounding code. A value copied because a tool can't import it says what to keep it in step with.
- Keep the test suite lean: prefer a few high-value tests (behavior that matters and could plausibly break) over full coverage.
- Biome formats and lints. `bun run check` and `bun test` must pass.
- Use Bun for every command (`bun install`/`add`, `bun run`, `bun x`), never npm, npx, pnpm or yarn; package scripts call binaries by bare name.

## Documentation

- Don't write down what the code already says (inventories of modules, status, ports, script lists, file paths). It goes stale. Put facts in the code, its names and its comments, where they change together.
- This file is only for what's relevant in nearly every session. Guidance for a particular kind of task goes in a skill under `.agents/skills/`.
- Each rule lives in one place; elsewhere, point to it instead of restating it.

## Improving the setup

- When a skill didn't work as well as it could have (wasted cycles, unclear instructions, commands that didn't work), offer to improve it.
- When installing a tool or changing system configuration would help (e.g. a runtime or CLI not found on this machine), offer to set it up.

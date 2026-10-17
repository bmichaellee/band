---
name: pwa-ui
description: Use when building or styling PWA components, hooks or services, or adding a theme.
---

# PWA UI

- **Layers:** services are plain fetch code (no React) → hooks wrap services in React state → components render. Components don't call `fetch` directly.
  - A service is an async function taking an optional `AbortSignal` last, with a kind-tagged state union beside it (`{ kind: "loading" } | …`).
  - Its hook runs it in `useEffect` with an `AbortController`, aborting on unmount.
  - A component calls its own hook and takes no data props; its styles are a `.css` file imported beside it.
  - A context exports `<Name>Provider` and `use<Name>()`, which throws outside the provider.
- **API calls** build URLs from the client config's API base URL and type responses with the shared schemas' inferred types (see the `api-endpoints` skill).
- **In CSS and components, colors come from the active theme** via CSS variables (`var(--color-<name>)`), never hard-coded. A new color is a new key on the theme colors type.
- **A new theme** is one file in the themes folder, listed in that folder's index.
- **Browser storage is optional:** wrap every `localStorage` access in try/catch and keep working without it (private mode, blocked site data).
- **Browser code never imports server-only config** (see the `env-and-builds` skill).
- **Check it** in the integrated browser on the PWA dev port, in more than one theme.

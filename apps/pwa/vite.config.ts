import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// The root .env is shared by every app, so read it from the repo root.
const envDir = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  const port = Number(env.PWA_PORT ?? 47391);
  // Same origin as production: /api and paths under it go to the API server.
  // A ^ key is a regex to Vite; a plain "/api" key would also match /apiary.
  // Keep the prefix in step with the API's, and the default port with
  // serverConfig's.
  const apiPath = /^\/api(\/|$)/;
  const proxy = {
    [apiPath.source]: `http://localhost:${env.API_PORT ?? 47392}`,
  };

  return {
    envDir,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        // Keep in step with clientConfig.appName and the light theme's
        // background; Vite's config can't import app code.
        manifest: {
          name: "Band Tools",
          short_name: "Band Tools",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#ffffff",
        },
        // Don't let the service worker answer /api navigations (e.g. /api/docs)
        // with the app shell.
        workbox: { navigateFallbackDenylist: [apiPath] },
      }),
    ],
    server: { port, strictPort: true, proxy },
    preview: { port, strictPort: true, proxy },
  };
});

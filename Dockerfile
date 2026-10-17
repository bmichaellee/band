# Production image: the bundled API serving the built PWA on one port.
# Build from the repo root: docker compose build (see compose.yml).

# Keep in step with .bun-version.
ARG BUN_VERSION=1.4.3

FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /app
COPY . .
# --ignore-scripts: the root "prepare" script sets up git hooks, and there's no git here.
RUN bun install --frozen-lockfile --ignore-scripts
RUN cd apps/pwa && bun run build
RUN cd apps/api && bun run build

FROM oven/bun:${BUN_VERSION}-slim
WORKDIR /app
# API_PORT is the container port: keep it in step with EXPOSE, the HEALTHCHECK
# URL and docker/nginx.conf's upstream.
ENV NODE_ENV=production \
    API_PORT=3000
# The API bundle is self-contained (no node_modules). It finds the PWA at ../../pwa/dist
# relative to itself, so keep this layout.
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/pwa/dist apps/pwa/dist
USER bun
EXPOSE 3000
# Keep the path in step with the API's health route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["bun", "-e", "fetch('http://localhost:3000/api/v0/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["bun", "apps/api/dist/index.js"]

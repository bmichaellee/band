import pkg from "@root/package.json" with { type: "json" };

// Bun.build rejects when the build fails, so a broken build exits non-zero.
await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "bun",
  define: {
    "process.env.APP_VERSION": JSON.stringify(pkg.version),
    // The bundle is the production artifact; Bun would otherwise inline the build-time value.
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

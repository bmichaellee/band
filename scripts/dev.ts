// Runs app dev servers and opens each in VS Code's integrated browser, unless a tab is already on it.
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Subprocess } from "bun";

import { openInBrowser } from "./integrated-browser";

const root = fileURLToPath(new URL("..", import.meta.url));

interface DevApp {
  /** Workspace directory whose `dev` script starts the server. */
  dir: string;
  /** Answers once the server is ready. */
  readyUrl: string;
  /** Page to open in the browser. */
  openUrl: string;
}

// Keep the default ports in step with the PWA's Vite config and serverConfig.
const pwaOrigin = `http://localhost:${process.env.PWA_PORT ?? 47391}`;
const apiOrigin = `http://localhost:${process.env.API_PORT ?? 47392}`;

const apps: Record<string, DevApp> = {
  pwa: { dir: "apps/pwa", readyUrl: `${pwaOrigin}/`, openUrl: `${pwaOrigin}/` },
  api: {
    dir: "apps/api",
    // Keep in step with the API's health route and docs path.
    readyUrl: `${apiOrigin}/api/v0/health`,
    openUrl: `${apiOrigin}/api/docs`,
  },
};

const names = process.argv.slice(2);
const unknown = names.filter((name) => !(name in apps));
if (names.length === 0 || unknown.length > 0) {
  console.error(
    `Usage: bun scripts/dev.ts <${Object.keys(apps).join("|")}>...`,
  );
  process.exit(1);
}

const children: Subprocess[] = [];
const stopAll = () => {
  for (const child of children) child.kill();
};
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, stopAll);

await Promise.all(names.map((name) => start(name, apps[name])));

// Nothing new was started: everything was already running.
if (children.length === 0) process.exit(0);

// If one server exits, take the rest down with it.
const code = await Promise.race(children.map((child) => child.exited));
stopAll();
process.exit(code);

async function start(name: string, app: DevApp): Promise<void> {
  if (await isUp(app.readyUrl)) {
    // Already running (e.g. in another terminal): just make sure it's open.
    console.log(`${name} dev server already running at ${app.openUrl}`);
  } else {
    const child = Bun.spawn(["bun", "run", "dev"], {
      cwd: join(root, app.dir),
      stdio: ["inherit", "inherit", "inherit"],
    });
    children.push(child);
    if (!(await waitForServer(child, app.readyUrl))) return;
  }
  await openInBrowser(app.openUrl, root);
}

async function isUp(target: string): Promise<boolean> {
  try {
    await fetch(target);
    return true;
  } catch {
    return false;
  }
}

async function waitForServer(
  child: Subprocess,
  target: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) return false;
    if (await isUp(target)) return true;
    await Bun.sleep(200);
  }
  return false;
}

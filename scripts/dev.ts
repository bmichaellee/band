// Runs app dev servers and opens each in VS Code's integrated browser, unless a tab is already on it.
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Subprocess } from "bun";

import { openInBrowser } from "./integrated-browser";

const root = fileURLToPath(new URL("..", import.meta.url));

interface DevApp {
  /** Workspace directory whose `dev` script starts the server. */
  dir: string;
  /** Port the server listens on; anything already on it is stopped first. */
  port: number;
  /** Answers once the server is ready. */
  readyUrl: string;
  /** Page to open in the browser. */
  openUrl: string;
}

// Keep the default ports in step with the PWA's Vite config and serverConfig.
const pwaPort = Number(process.env.PWA_PORT ?? 47391);
const apiPort = Number(process.env.API_PORT ?? 47392);
const pwaOrigin = `http://localhost:${pwaPort}`;
const apiOrigin = `http://localhost:${apiPort}`;

const apps: Record<string, DevApp> = {
  pwa: {
    dir: "apps/pwa",
    port: pwaPort,
    readyUrl: `${pwaOrigin}/`,
    openUrl: `${pwaOrigin}/`,
  },
  api: {
    dir: "apps/api",
    port: apiPort,
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

// If one server exits, take the rest down with it.
const code = await Promise.race(children.map((child) => child.exited));
stopAll();
process.exit(code);

async function start(name: string, app: DevApp): Promise<void> {
  // A leftover server (e.g. from another terminal) would answer the readiness
  // check and keep running stale code, so it's stopped before this one starts.
  await freePort(app.port);
  console.log(`Starting ${name} dev server at ${app.openUrl}`);
  const child = Bun.spawn(["bun", "run", "dev"], {
    cwd: join(root, app.dir),
    stdio: ["inherit", "inherit", "inherit"],
  });
  children.push(child);
  if (!(await waitForServer(child, app.readyUrl))) return;
  await openInBrowser(app.openUrl, root);
}

async function freePort(port: number): Promise<void> {
  for (const pid of listeningPids(port)) {
    if (pid === process.pid) continue;
    console.log(`Stopping process ${pid} on port ${port}`);
    if (process.platform === "win32") {
      // /T takes down the child processes too (bun --watch and vite).
      Bun.spawnSync(["taskkill", "/PID", String(pid), "/T", "/F"]);
    } else {
      process.kill(pid, "SIGTERM");
    }
  }
}

function listeningPids(port: number): number[] {
  if (process.platform === "win32") {
    // Columns: proto, local address, foreign address, state, pid.
    const out = Bun.spawnSync([
      "netstat",
      "-ano",
      "-p",
      "TCP",
    ]).stdout.toString();
    return out.split("\n").flatMap((line) => {
      const cols = line.trim().split(/\s+/);
      return cols.length === 5 &&
        cols[3] === "LISTENING" &&
        cols[1].endsWith(`:${port}`)
        ? [Number(cols[4])]
        : [];
    });
  }
  const out = Bun.spawnSync([
    "lsof",
    "-ti",
    `tcp:${port}`,
    "-sTCP:LISTEN",
  ]).stdout.toString();
  return out.split("\n").filter(Boolean).map(Number);
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

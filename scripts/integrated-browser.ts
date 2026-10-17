// Drives VS Code's integrated browser through the Integrated Browser MCP
// extension's local bridge; also prints URLs for VS Code's native browser tools.
import { readdirSync, readFileSync } from "node:fs";
import http from "node:http";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/** Opens `target` in the VS Code window for `workspace` unless already open. */
export async function openInBrowser(
  target: string,
  workspace: string,
): Promise<void> {
  console.log(`VS Code native browser tools: open or share ${target}`);
  const socketPath = findBridgeSocket(workspace);
  if (!socketPath) {
    console.log(
      `MCP bridge not found; use VS Code's native browser tools or click ${target}.`,
    );
    return;
  }
  try {
    const tabs = await bridge<{ tabId: string; url: string }[]>(
      socketPath,
      "GET",
      "/tabs",
    );
    const existing = tabs.find((tab) => tab.url.startsWith(target));
    if (existing) {
      console.log(`Already open in the integrated browser (${existing.url}).`);
      return;
    }
    await bridge(socketPath, "POST", "/tab/open", {
      url: target,
      makeActive: true,
    });
    console.log(`Opened ${target} in the integrated browser.`);
  } catch (error) {
    console.log(
      `Could not open the integrated browser (${(error as Error).message}); open ${target} manually.`,
    );
  }
}

// Each VS Code window registers its bridge in
// ~/.integrated-browser-mcp/instances; pick the one for `workspace`.
function findBridgeSocket(workspace: string): string | undefined {
  const dir = join(homedir(), ".integrated-browser-mcp", "instances");
  const normalize = (path: string) => resolve(path).toLowerCase();
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    // Extension not installed or no instances yet.
    return undefined;
  }
  for (const file of files) {
    try {
      const instance = JSON.parse(readFileSync(join(dir, file), "utf8"));
      if (normalize(instance.workspace) === normalize(workspace))
        return instance.socketPath;
    } catch {
      // A stale or half-written file mustn't stop the scan.
    }
  }
  return undefined;
}

function bridge<T>(
  socketPath: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  return new Promise((done, fail) => {
    const request = http.request(
      {
        socketPath,
        method,
        path,
        headers: {
          "Content-Type": "application/json",
          "X-Bridge-Client": "dev-script",
        },
      },
      (response) => {
        let raw = "";
        response.on("data", (chunk) => (raw += chunk));
        response.on("end", () => {
          // A throw in this listener would escape the promise, not reject it.
          try {
            const parsed = JSON.parse(raw);
            parsed.ok ? done(parsed.data) : fail(new Error(parsed.error));
          } catch (error) {
            fail(error);
          }
        });
      },
    );
    request.on("error", fail);
    request.end(body === undefined ? undefined : JSON.stringify(body));
  });
}

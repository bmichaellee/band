import { useHealth } from "#hooks";
import type { HealthState } from "#services";

/** One line reporting whether the API and its database are reachable. */
export function HealthCheck() {
  return <div>{describe(useHealth())}</div>;
}

function describe(state: HealthState): string {
  switch (state.kind) {
    case "loading":
      return "Checking API…";
    case "failed":
      return `API unreachable (${state.message})`;
    case "loaded":
      return state.health.db.connected
        ? `API ok · database connected (${state.health.db.latencyMs} ms)`
        : "API ok · database disconnected";
  }
}

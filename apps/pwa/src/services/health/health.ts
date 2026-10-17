import { clientConfig } from "@band-tools/config/client";
import type { Health } from "@band-tools/types";

/** Where a health check is in its lifecycle, for UI that shows it. */
export type HealthState =
  | { kind: "loading" }
  | { kind: "loaded"; health: Health }
  | { kind: "failed"; message: string };

/**
 * Fetches the API's health report. A 503 still carries one (the API is up,
 * the database isn't), so it resolves; other non-2xx statuses, network errors
 * and non-JSON bodies throw. The body's shape isn't checked.
 */
export async function getHealth(signal?: AbortSignal): Promise<Health> {
  const response = await fetch(`${clientConfig.apiBaseUrl}/v0/health`, {
    signal,
  });
  if (!response.ok && response.status !== 503) {
    throw new Error(
      `Health check failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}

import { z } from "zod";

/** Health report for the API and the services it depends on. */
export const HealthSchema = z.object({
  /** `ok` when every dependency is reachable, otherwise `error`. */
  status: z.enum(["ok", "error"]),
  db: z.object({
    /** Whether a `select 1` succeeded. */
    connected: z.boolean(),
    /** Round trip of the `select 1`, in milliseconds. */
    latencyMs: z
      .number()
      .meta({ description: "Round trip of a `select 1`, in milliseconds" }),
  }),
});

export type Health = z.infer<typeof HealthSchema>;

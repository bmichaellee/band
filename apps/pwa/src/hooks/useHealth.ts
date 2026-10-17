import { useEffect, useState } from "react";

import { getHealth, type HealthState } from "#services";

/** Checks the API's health once on mount; the request is cancelled on unmount. */
export function useHealth(): HealthState {
  const [health, setHealth] = useState<HealthState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((result) => setHealth({ kind: "loaded", health: result }))
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          setHealth({ kind: "failed", message: error.message });
      });
    return () => controller.abort();
  }, []);

  return health;
}

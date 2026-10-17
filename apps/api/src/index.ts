import { serverConfig } from "@band-tools/config/server";
import { closeDb } from "@band-tools/db";

import { app } from "./app";
import { db } from "./db";

app.listen(serverConfig.port);
console.log(
  `api listening on http://localhost:${serverConfig.port}` +
    (serverConfig.docs ? " (docs at /api/docs)" : ""),
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.stop();
    await closeDb(db);
    process.exit(0);
  });
}

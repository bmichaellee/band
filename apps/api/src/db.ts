import { serverConfig } from "@band-tools/config/server";
import { openDb } from "@band-tools/db";

/** The API's shared database client. */
export const db = openDb(serverConfig.databaseUrl);

import pkg from "../package.json" with { type: "json" };
import "./load-env";

process.env.APP_VERSION ??= pkg.version;

export function getVersion(): string {
  if (typeof process !== "undefined" && process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }
  return "dev";
}

// Cookie and in-memory session helpers shared by the fake providers.
const SESSION_COOKIE = "session";
// No `Secure` so it works over plain http on localhost; a real provider should set it.
const ATTRS = "Path=/; HttpOnly; SameSite=Lax";

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
}

export function setCookie(name: string, value: string, maxAge?: number) {
  const age = maxAge === undefined ? "" : `; Max-Age=${maxAge}`;
  return `${name}=${value}; ${ATTRS}${age}`;
}

/**
 * One provider's sessions, in memory only (lost on restart). Each provider has
 * its own store, so it only recognizes sessions it started.
 */
export function createSessionStore() {
  const tokens = new Set<string>();
  return {
    has(request: Request): boolean {
      const token = readCookie(request, SESSION_COOKIE);
      return token !== undefined && tokens.has(token);
    },
    /** Starts a session and returns the `set-cookie` value that carries it. */
    start(): string {
      const token = crypto.randomUUID();
      tokens.add(token);
      return setCookie(SESSION_COOKIE, token);
    },
    /** Ends the request's session and returns the `set-cookie` value that clears it. */
    end(request: Request): string {
      const token = readCookie(request, SESSION_COOKIE);
      if (token) tokens.delete(token);
      return setCookie(SESSION_COOKIE, "", 0);
    },
  };
}

// Cookie and in-memory session helpers shared by the providers.
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
 * One provider's sessions, each holding a value (e.g. the user), in memory only
 * (lost on restart). Each provider has its own store, so it only recognizes
 * sessions it started.
 */
export function createSessionStore<T>() {
  const sessions = new Map<string, T>();
  return {
    /** What the request's session holds, or `undefined` when this store has none for it. */
    get(request: Request): T | undefined {
      const token = readCookie(request, SESSION_COOKIE);
      return token === undefined ? undefined : sessions.get(token);
    },
    /** Starts a session holding `value` and returns the `set-cookie` value that carries it. */
    start(value: T): string {
      const token = crypto.randomUUID();
      sessions.set(token, value);
      return setCookie(SESSION_COOKIE, token);
    },
    /** Ends the request's session and returns the `set-cookie` value that clears it. */
    end(request: Request): string {
      const token = readCookie(request, SESSION_COOKIE);
      if (token) sessions.delete(token);
      return setCookie(SESSION_COOKIE, "", 0);
    },
  };
}

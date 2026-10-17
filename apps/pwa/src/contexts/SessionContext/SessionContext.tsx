import type { LoginCredentials, User } from "@band-tools/types";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  type LoginResult,
  login as loginRequest,
  logout as logoutRequest,
} from "#services";

interface SessionContextValue {
  /** The logged-in user, or `null` when there's no session (or it's still loading). */
  user: User | null;
  /** True until the initial lookup of the current user settles. */
  loading: boolean;
  /** Logs in with a provider; on success `user` is set. */
  login: (
    provider: string,
    credentials: LoginCredentials,
  ) => Promise<LoginResult>;
  /** Ends the session and clears `user`. */
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Loads the current user once on mount and provides the session to the tree. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then(setUser)
      .catch(() => {
        // Treated as logged out; the API being down shows up elsewhere (health).
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(
    async (provider: string, credentials: LoginCredentials) => {
      const result = await loginRequest(provider, credentials);
      if (result.kind === "ok") setUser(result.user);
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

/** The current user and login/logout. Must be used inside {@link SessionProvider}. */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value)
    throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

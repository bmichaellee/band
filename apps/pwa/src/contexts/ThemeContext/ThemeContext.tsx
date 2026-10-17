import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { type Theme, themes } from "../themes";

const STORAGE_KEY = "theme";

interface ThemeContextValue {
  /** The active theme. */
  theme: Theme;
  /** Every theme the user can pick from. */
  themes: readonly Theme[];
  /** Switches theme by id and remembers the choice; unknown ids are ignored. */
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Applies the active theme as CSS variables on `<html>` and provides it to the tree. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setActive] = useState(initialTheme);

  // Layout effect so the colors are in place before the first paint.
  useLayoutEffect(() => applyTheme(theme), [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themes,
      setTheme: (id) => {
        const next = themes.find((t) => t.id === id);
        if (!next) return;
        setActive(next);
        try {
          localStorage.setItem(STORAGE_KEY, next.id);
        } catch {
          // Storage unavailable (private mode, blocked); the choice just won't persist.
        }
      },
    }),
    [theme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/** The active theme and a way to change it. Must be used inside {@link ThemeProvider}. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}

/** The saved theme, else the one matching the system's light/dark preference, else the first. */
function initialTheme(): Theme {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable; fall through to the system preference.
  }
  const scheme = matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  return (
    themes.find((t) => t.id === saved) ??
    themes.find((t) => t.colorScheme === scheme) ??
    themes[0]
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.colorScheme;
  for (const [name, color] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${name}`, color);
  }
  // Tints the browser/OS chrome around the installed PWA.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme.colors.background);
}

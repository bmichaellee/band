/** Colors every theme must define. Each becomes a `--color-<name>` CSS variable. */
export interface ThemeColors {
  background: string;
  text: string;
  muted: string;
  accent: string;
}

export interface Theme {
  /** Stable key, saved as the user's choice. */
  id: string;
  /** Name shown in the theme picker. */
  label: string;
  /** Tells the browser how to draw native controls (inputs, scrollbars). */
  colorScheme: "light" | "dark";
  colors: ThemeColors;
}

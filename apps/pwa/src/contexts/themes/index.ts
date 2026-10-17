import { darkTheme } from "./dark";
import { lightTheme } from "./light";
import type { Theme } from "./types";

export type { Theme } from "./types";

/** Every available theme, in picker order. */
export const themes: readonly Theme[] = [lightTheme, darkTheme];

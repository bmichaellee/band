import { expect, test } from "bun:test";
import { fireEvent, render, within } from "@testing-library/react";

import { themes } from "../themes";
import { ThemeProvider, useTheme } from "./ThemeContext";

function ThemeButtons() {
  const { setTheme } = useTheme();
  return themes.map((t) => (
    <button key={t.id} type="button" onClick={() => setTheme(t.id)}>
      {t.label}
    </button>
  ));
}

test("ThemeProvider remembers the chosen theme", () => {
  const root = document.documentElement;
  const first = render(
    <ThemeProvider>
      <ThemeButtons />
    </ThemeProvider>,
  );
  // Not the initial theme: a fresh provider would show that one anyway.
  const chosen = themes.find((t) => t.id !== root.dataset.theme);
  if (!chosen) throw new Error("needs a second theme to switch to");
  fireEvent.click(
    within(first.container).getByRole("button", { name: chosen.label }),
  );
  first.unmount();

  // A fresh provider stands in for the next visit.
  render(<ThemeProvider>{null}</ThemeProvider>);

  expect(root.dataset.theme).toBe(chosen.id);
  expect(root.style.getPropertyValue("--color-background")).toBe(
    chosen.colors.background,
  );
});

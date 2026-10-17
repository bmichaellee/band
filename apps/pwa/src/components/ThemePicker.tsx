import { useTheme } from "#contexts";

/** Dropdown listing every theme; switching applies and remembers it. */
export function ThemePicker() {
  const { theme, themes, setTheme } = useTheme();
  return (
    <label>
      Theme{" "}
      <select value={theme.id} onChange={(e) => setTheme(e.target.value)}>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}

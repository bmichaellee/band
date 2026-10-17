import { clientConfig } from "@band-tools/config/client";

import { HealthCheck, ThemePicker } from "#components";
import { ThemeProvider } from "#contexts";

import "./App.css";

export function App() {
  return (
    <ThemeProvider>
      <main className="app">
        <div>{clientConfig.appName}</div>
        <HealthCheck />
        <ThemePicker />
      </main>
    </ThemeProvider>
  );
}

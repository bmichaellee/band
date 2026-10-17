import { clientConfig } from "@band-tools/config/client";

import { HealthCheck, LoginForm, ThemePicker } from "#components";
import { SessionProvider, ThemeProvider } from "#contexts";

import "./App.css";

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <main className="app">
          <div>{clientConfig.appName}</div>
          <HealthCheck />
          <ThemePicker />
          <LoginForm />
        </main>
      </SessionProvider>
    </ThemeProvider>
  );
}

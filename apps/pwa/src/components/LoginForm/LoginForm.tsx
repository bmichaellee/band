import type { AuthProviderInfo } from "@band-tools/types";
import { useEffect, useState } from "react";

import { useSession } from "#contexts";
import { getProviders, redirectLoginUrl } from "#services";
import "./LoginForm.css";

/**
 * Temporary. Delete this component once design is complete.
 */
export const LoginForm = () => {
  const [providers, setProviders] = useState<AuthProviderInfo[]>([]);
  const { user, login, logout } = useSession();

  useEffect(() => {
    getProviders().then((providers) => {
      setProviders(providers);
    });
  }, []);

  useEffect(() => {
    console.log({ providers });
  }, [providers]);

  const handleSelectProvider = (provider: AuthProviderInfo) => {
    if (provider.redirect) {
      window.location.assign(redirectLoginUrl(provider.id));
    } else {
      login(provider.id, { username: "", password: "" });
    }
  };

  const handleLogout = () => {
    logout();
  };

  const renderUser = () => (
    <div>
      <code>
        {user ? `Logged in as: ${JSON.stringify(user)}` : "Not logged in"}
      </code>
    </div>
  );

  const renderProviders = () => {
    return (
      <div>
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleSelectProvider(provider)}
          >
            Login with {provider.id}
          </button>
        ))}
      </div>
    );
  };

  const renderLogout = () => (
    <div>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );

  return (
    <form className="login-form">
      {renderUser()}
      {user ? renderLogout() : renderProviders()}
    </form>
  );
};

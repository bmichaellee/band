import { serverConfig } from "@band-tools/config/server";

import { fakeDirectAuth, fakeRedirectAuth } from "./fake";
import { createKeycloakAuth } from "./keycloak";
import { createAuth } from "./registry";

const { keycloak } = serverConfig;

// The ids are what clients ask for (`/login/<id>`). Swap or add providers here.
// The second argument is the one `/login` uses when no id is given.
export const auth = createAuth(
  {
    "fake-direct": fakeDirectAuth,
    "fake-redirect": fakeRedirectAuth,
    // Only where Keycloak is configured (see serverConfig).
    ...(keycloak && { keycloak: createKeycloakAuth(keycloak) }),
  },
  "fake-direct",
);

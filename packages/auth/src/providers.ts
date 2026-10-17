import { fakeDirectAuth, fakeRedirectAuth } from "./fake";
import { createAuth } from "./registry";

// The ids are what clients ask for (`/login/<id>`). Swap or add providers here.
// The second argument is the one `/login` uses when no id is given.
export const auth = createAuth(
  {
    "fake-direct": fakeDirectAuth,
    "fake-redirect": fakeRedirectAuth,
  },
  "fake-direct",
);

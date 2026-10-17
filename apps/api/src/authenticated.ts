import { auth } from "@band-tools/auth";
import { Elysia } from "elysia";

/** Routes opt in with `{ auth: true }` and get `user` in their context; otherwise they respond 401. */
export const authenticated = new Elysia({ name: "authenticated" }).macro({
  auth: {
    async resolve({ request, status }) {
      const user = await auth.authenticate(request);
      if (!user) return status(401, { error: "Unauthorized" });
      return { user };
    },
  },
});

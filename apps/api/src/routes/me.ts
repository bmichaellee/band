import { auth } from "@band-tools/auth";
import { type User, UserSchema } from "@band-tools/types";
import { Elysia } from "elysia";

// Not behind `{ auth: true }`: being logged out is an expected answer here, and
// a 401 would show up as an error in the browser console on every page load.
export const meRoutes = new Elysia({
  name: "routes/me",
  tags: ["Session"],
}).get(
  "/me",
  // Response.json because Elysia sends a bare `null` as an empty body, not JSON.
  async ({ request }) => {
    const user: User | null = await auth.authenticate(request);
    return Response.json(user);
  },
  {
    detail: {
      summary: "Current user",
      description:
        "Returns the logged-in user, or `null` when there's no session.",
    },
    response: { 200: UserSchema.nullable() },
  },
);

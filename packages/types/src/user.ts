import { z } from "zod";

/**
 * Identifier for a {@link User}, generated with `nanoid` (21 URL-safe characters).
 *
 * Branded so a plain string can't be passed where a user ID is expected.
 * Create one with `UserIdSchema.parse(value)` or cast a fresh `nanoid()` result.
 */
export const UserIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{21}$/, "Expected a 21-character nanoid")
  .brand<"UserId">();

export type UserId = z.infer<typeof UserIdSchema>;

export const UserSchema = z.object({
  /** Unique identifier for the user. Stable across renames. */
  id: UserIdSchema,
  /** Display name of the user, as shown to other users. */
  name: z.string(),
  /** Email address used for sign-in and notifications. */
  email: z.email(),
});

/**
 * A user of the suite.
 *
 * Plain data only: no methods, no class instances. Safe to serialize as JSON.
 *
 * @remarks
 * Values from outside the app (requests, storage, user input) should be checked
 * with `UserSchema` before they are typed as `User`.
 *
 * @example
 * ```ts
 * const user: User = {
 *   id: UserIdSchema.parse("V1StGXR8_Z5jdHi6B-myT"),
 *   name: "Brandon Lee",
 *   email: "brandon@example.com",
 * };
 * ```
 */
export type User = z.infer<typeof UserSchema>;

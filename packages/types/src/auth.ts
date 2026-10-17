import { z } from "zod";

/**
 * A way of logging in that the API offers, for a client to build its login
 * choices from. Each is one method; a service offering both is listed twice.
 */
export const AuthProviderInfoSchema = z.object({
  /** What to put in the path: `/login/<id>`. */
  id: z.string(),
  /**
   * `true`: navigate the page to `/login/<id>` (an external identity provider).
   * Absent or `false`: POST credentials to `/login/<id>`.
   */
  redirect: z.boolean().optional(),
  /** Whether `/login` without a provider uses this one. */
  default: z.boolean(),
});

export type AuthProviderInfo = z.infer<typeof AuthProviderInfoSchema>;

export const AuthProviderListSchema = z.array(AuthProviderInfoSchema);

/** What a direct login sends: the credentials the chosen provider expects. */
export const LoginCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Public surface of @band-tools/auth.
// Consumers import only from here, never from the underlying auth library.
export type {
  AuthProvider,
  DirectAuthProvider,
  RedirectAuthProvider,
} from "./auth";
export { auth } from "./providers";

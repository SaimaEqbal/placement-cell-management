/**
 * Minimal publish/subscribe channel used to announce that the current
 * session is no longer valid (expired/invalid JWT -> 401 from the API).
 *
 * Purpose: kept separate from React (no Context/hooks here) so the plain
 * Axios response interceptor in axiosInstance.ts can notify the rest of the
 * app without importing AuthContext or React Router, which would create a
 * circular dependency between src/api and src/context/src/routes.
 */

type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

/** Purpose: let AuthContext subscribe and react (clear user, redirect to /login) on 401. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Purpose: called by the Axios response interceptor whenever any request comes back 401. */
export function emitUnauthorized(): void {
  listeners.forEach((listener) => listener());
}

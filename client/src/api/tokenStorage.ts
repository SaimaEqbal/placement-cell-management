// Centralised localStorage access for the persisted JWT access token.
//
// Purpose: kept in its own tiny module - instead of inline in axiosInstance.ts
// and AuthContext.tsx - so both the Axios layer and AuthContext read/write the
// *same* storage key without importing each other (which would create a
// circular dependency between src/api and src/context).

const TOKEN_STORAGE_KEY = "upms.auth.token";

/** Purpose: read the persisted JWT (if any) from localStorage. */
export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage can throw in some privacy modes / disabled storage - treat as logged out.
    return null;
  }
}

/** Purpose: persist the JWT returned by POST /auth/login so refreshes stay signed in. */
export function setStoredToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore write failures - app still works for the rest of the session, just won't survive a refresh.
  }
}

/** Purpose: remove the JWT on logout or a forced sign-out (e.g. 401 from the API). */
export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clearStoredToken, getStoredToken, setStoredToken } from "../api/tokenStorage";
import { onUnauthorized } from "../api/authEvents";
import { decodeAccessToken, isTokenExpired } from "../lib/jwt";
import type { Role } from "../types";

// Per project rules, Context is ONLY for authentication state and
// multi-step-workflow state - never server data (that's TanStack Query's
// job, see src/hooks/). This file is the authentication half.

/** Minimal identity decoded from the JWT - see src/lib/jwt.ts for why this is decode-only, not verified. */
export interface AuthUser {
  id: string;
  role: Role;
  /** Institutional email, decoded from the access token. Lets pages reuse it instead of re-collecting it. */
  email?: string;
}

interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  /** Purpose: store a freshly-issued access token (after the POST /auth/login mutation resolves) and derive user/role from it. */
  login: (token: string) => void;
  /** Purpose: clear the session locally. There is no /auth/logout route on the backend - JWTs just expire - so this is a client-only reset. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Purpose: build the {user, role, token, isAuthenticated} state from a raw JWT, treating a missing/expired/malformed token as "logged out". */
function deriveState(token: string | null): AuthState {
  if (!token || isTokenExpired(token)) {
    return { user: null, role: null, token: null, isAuthenticated: false };
  }

  const decoded = decodeAccessToken(token);
  if (!decoded) {
    return { user: null, role: null, token: null, isAuthenticated: false };
  }

  const role = decoded.role as Role;
  return {
    user: { id: decoded.userId, role, email: decoded.email },
    role,
    token,
    isAuthenticated: true,
  };
}

/** Purpose: provide auth state + login/logout to the whole app; wraps <AppRoutes /> in App.tsx. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => deriveState(getStoredToken()));

  const login = useCallback((token: string) => {
    setStoredToken(token);
    setState(deriveState(token));
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setState({ user: null, role: null, token: null, isAuthenticated: false });
  }, []);

  // Purpose: react to a 401 raised anywhere in the app (see
  // src/api/axiosInstance.ts's response interceptor) by dropping the local
  // session - e.g. when the token expires mid-session - so ProtectedRoute
  // redirects to /login on the next render.
  useEffect(() => onUnauthorized(logout), [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Purpose: typed access to auth state/actions from any component; throws early if used outside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

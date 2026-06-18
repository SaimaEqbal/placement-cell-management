import axios, { type AxiosError } from "axios";

import { clearStoredToken, getStoredToken } from "./tokenStorage";
import { emitUnauthorized } from "./authEvents";
import type { ApiError } from "./apiError";

// Backend base URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/* The one and only Axios instance for this app. Components/pages never call Axios directly - every request goes through a file in src/services/, and every service goes through this instance, so auth headers and error shapes stay consistent everywhere. */

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*Request interceptor: attach the JWT. Purpose: every protected backend route (see server/src/middleware/authMiddleware.js) expects `Authorization: Bearer <token>`. Attaching it here means services never have to remember to do it themselves.*/

axiosInstance.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* Response interceptor. Runs after every backend response. Successful responses are passed through unchanged. Failed responses are normalised into the application's ApiError shape so components and TanStack Query can handle errors consistently. If the backend returns 401 Unauthorized (expired, invalid or missing JWT), the stored access token is cleared and the rest of the application is notified that the session has ended. This keeps authentication state in sync with the backend and prevents the UI from continuing to act as if the user is logged in. */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = toApiError(error);

    if (apiError.status === 401) {
      clearStoredToken();
      emitUnauthorized();
    }

    return Promise.reject(apiError);
  },
);

/**
 * Purpose: turn whatever Axios/Express handed back into the single ApiError shape the rest of the app relies on. Real backend bug found while wiring this up, documented here rather than fixed (per project rules, server/ is not to be touched): server/src/middleware/authMiddleware.js references `jwt` and `pool` but never imports them, so *every* route behind the `auth` middleware (GET /students/me, the write routes on /companies, all of /spc and /tpc) currently throws a ReferenceError, and Express's default error handler returns a plain-text/HTML 500 body instead of JSON.This function defends against that (and any other non-JSON error body) so the UI shows a sane message instead of crashing on `error.response.data.message`.
 */
function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? null;
  const data = error.response?.data as
    | { message?: string; errors?: unknown }
    | string
    | undefined;

  // The Zod-backed validation middlewares (see server/src/middleware/*.js)
  // reply with either `{ errors: ZodIssue[] }` (from schema.parse()) or
  // `{ errors: { field: string[] } }` (from schema.safeParse().flatten()).
  // Normalise both shapes into a single field -> messages map.
  let fieldErrors: Record<string, string[]> | undefined;
  if (data && typeof data === "object" && data.errors) {
    if (Array.isArray(data.errors)) {
      fieldErrors = {};
      for (const issue of data.errors as Array<{
        path?: Array<string | number>;
        message: string;
      }>) {
        const key = issue.path?.length ? issue.path.join(".") : "_";
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
    } else if (typeof data.errors === "object") {
      fieldErrors = data.errors as Record<string, string[]>;
    }
  }

  let message: string;
  if (data && typeof data === "object" && typeof data.message === "string") {
    message = data.message;
  } else if (!error.response) {
    message =
      "Could not reach the server. Check your connection and that the API is running.";
  } else {
    message = `Request failed (${status ?? "unknown error"}).`;
  }

  return { status, message, fieldErrors };
}

export default axiosInstance;

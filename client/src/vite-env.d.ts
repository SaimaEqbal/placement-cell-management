/// <reference types="vite/client" />

// Purpose: describe the custom Vite env vars this app reads via import.meta.env,
// so axiosInstance.ts (and anything else) gets type-checking/autocomplete
// instead of falling back to `any`.
interface ImportMetaEnv {
  /**
   * Base URL of the Express API, e.g. http://localhost:3000/api.
   * See client/.env.example - copy it to client/.env and adjust the port to
   * match whatever the backend actually prints on startup.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

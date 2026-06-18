/*Purpose: the single error shape every service/hook/page in this app relies on, regardless of what the backend actually sent back - a clean Express  JSON error (`{ message }`), a Zod validation payload (`{ errors }`, either as an issue array from .parse() or a flattened field map from .safeParse().flatten()), or even a non-JSON body .*/
export interface ApiError {
  /** HTTP status code, or null when the request never reached the server (network/CORS failure). */
  status: number | null;
  /** Human-readable message safe to show directly in the UI. */
  message: string;
  /** Per-field validation messages, when the backend's Zod middleware rejected the request body. */
  fieldErrors?: Record<string, string[]>;
}

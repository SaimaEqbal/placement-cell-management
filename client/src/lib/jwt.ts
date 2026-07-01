/** Purpose: decode the payload of the JWT issued by POST/auth/login (server/src/controllers/authController.js signs { userId, role } with JWT_ACCESS_SECRET). This module only ever reads claims so the UI can route/greet correctly; it must never be treated as an authorization check - the server re-verifies the signature on every protected request via server/src/middleware/authMiddleware.js, and that is the actual security boundary. */

export interface DecodedAccessToken {
  userId: string;
  role: string;
  email?: string;
  exp?: number;
}

/** Purpose: pull { userId, role, exp } out of a JWT's payload segment without verifying its signature. */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    /** JWTs use base64url; atob() expects standard base64, so restore the characters base64url swaps out before decoding. */
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(base64).split("").map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")).join(""),);

    const payload = JSON.parse(json) as Record<string, unknown>;
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
      email: typeof payload.email === "string" ? payload.email : undefined,
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}

/** Purpose: true when the token's `exp` claim is missing or already in the past, so callers can treat it as expired. */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeAccessToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 <= Date.now();
}
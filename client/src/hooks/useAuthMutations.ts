import { useMutation } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  forgotPassword,
  login,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
  type LoginPayload,
  type LoginResponse,
  type MessageResponse,
  type SignupPayload,
  type SignupResponse,
} from "../services/authService";

// Purpose: TanStack Query mutation wrappers around authService - gives every
// auth page consistent isPending/error handling instead of each page rolling
// its own try/catch + loading boolean. AuthContext.login() is called from a
// page's onSuccess handler with the returned token; it never makes the
// network call itself, keeping Context free of server-state concerns (see
// the project's Context API Usage rules).

/** Purpose: POST /auth/signup mutation for RegistrationPage. */
export function useSignup() {
  return useMutation<SignupResponse, ApiError, SignupPayload>({
    mutationFn: signup,
  });
}

/** Purpose: POST /auth/login mutation for LoginPage. */
export function useLogin() {
  return useMutation<LoginResponse, ApiError, LoginPayload>({
    mutationFn: login,
  });
}

/** Purpose: GET /auth/verify-email mutation (triggered on mount) for VerifyEmailPage. */
export function useVerifyEmail() {
  return useMutation<MessageResponse, ApiError, string>({
    mutationFn: verifyEmail,
  });
}

/** Purpose: POST /auth/resend-verification mutation. */
export function useResendVerification() {
  return useMutation<MessageResponse, ApiError, string>({
    mutationFn: resendVerification,
  });
}

/** Purpose: POST /auth/forgot-password mutation for ForgotPasswordPage. */
export function useForgotPassword() {
  return useMutation<MessageResponse, ApiError, string>({
    mutationFn: forgotPassword,
  });
}

/** Purpose: POST /auth/reset-password mutation for ResetPasswordPage. */
export function useResetPassword() {
  return useMutation<
    MessageResponse,
    ApiError,
    { token: string; password: string }
  >({
    mutationFn: ({ token, password }) => resetPassword(token, password),
  });
}

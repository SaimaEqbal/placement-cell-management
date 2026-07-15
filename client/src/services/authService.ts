import { axiosInstance } from "../api/axiosInstance";

/** Purpose: every Axios call related to authentication - signup, login, email verification, password reset - lives here. Components/hooks never call Axios directly. */

export interface SignupPayload {
  email: string;
  password: string;
}

export interface SignupResponse {
  message: string;
  user: { id: string; email: string };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface MessageResponse {
  message: string;
}

/** Purpose: POST /auth/signup - create the `users` row for a new student account. */
export function signup(payload: SignupPayload) {
  return axiosInstance
    .post<SignupResponse>("/auth/signup", payload)
    .then((res) => res.data);
}

/** Purpose: GET /auth/verify-email - confirm the email-verification link the student received. */
export function verifyEmail(token: string) {
  return axiosInstance
    .get<MessageResponse>("/auth/verify-email", { params: { token } })
    .then((res) => res.data);
}

/** Purpose: POST /auth/login - exchange credentials for the JWT access token that AuthContext stores. */
export function login(payload: LoginPayload) {
  return axiosInstance
    .post<LoginResponse>("/auth/login", payload)
    .then((res) => res.data);
}

/** Purpose: POST /auth/resend-verification - re-send the verification email for an unverified account. */
export function resendVerification(email: string) {
  return axiosInstance
    .post<MessageResponse>("/auth/resend-verification", { email })
    .then((res) => res.data);
}

/** Purpose: POST /auth/forgot-password - request a password-reset email. */
export function forgotPassword(email: string) {
  return axiosInstance
    .post<MessageResponse>("/auth/forgot-password", { email })
    .then((res) => res.data);
}

/** Purpose: POST /auth/reset-password - set a new password using the token from the reset email. */
export function resetPassword(token: string, password: string) {
  return axiosInstance
    .post<MessageResponse>("/auth/reset-password", { token, password })
    .then((res) => res.data);
}

/** A row from GET /auth/admins - an admin account (users carry only an email, no name). */
export interface AdminAccountRow {
  id: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

/** Purpose: GET /auth/admins - every admin account (Admin only). */
export function getAllAdmins() {
  return axiosInstance
    .get<AdminAccountRow[]>("/auth/admins")
    .then((res) => res.data);
}

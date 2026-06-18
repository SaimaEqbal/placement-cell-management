import type { Role } from "../types";

// Purpose: centralised route path constants, matching the routing table in
// the project brief exactly (including its capitalisation - /Student, /SPC,
// /TPC, /Admin) so every NavLink/redirect/useNavigate call in the app stays
// in sync with one source of truth instead of repeating string literals.
export const paths = {
  login: "/login",
  register: "/register",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  student: "/Student",
  studentProfile: "/Student/profile",
  studentCompleteProfile: "/Student/complete-profile",
  studentDrives: "/Student/drives",
  studentNotifications: "/Student/notifications",

  spc: "/SPC",
  spcStudents: "/SPC/students",
  spcVerification: "/SPC/verification",

  tpc: "/TPC",
  tpcVerification: "/TPC/verification",

  admin: "/Admin",
  adminCompanies: "/Admin/companies",
  adminDrives: "/Admin/drives",
  adminStudents: "/Admin/students",
} as const;

/* Purpose: where to land a freshly-authenticated user (or anyone hitting a route their role can't see), based on their role. */
export function homePathForRole(role: Role | null): string {
  switch (role) {
    case "student":
      return paths.student;
    case "spc":
      return paths.spc;
    case "tpc":
      return paths.tpc;
    case "admin":
      return paths.admin;
    default:
      return paths.login;
  }
}

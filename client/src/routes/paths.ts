import type { Role } from "../types";

/**
 * Purpose: centralised route path constants, matching the routing table in
 * the project brief exactly (including its capitalisation - /Student, /SPC,
 * /TPC, /Admin) so every NavLink/redirect/useNavigate call in the app stays
 * in sync with one source of truth instead of repeating string literals.
 */
export const paths = {
  login: "/login",
  register: "/register",
  inviteRegister: "/register/:token",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  student: "/Student",
  studentProfile: "/Student/profile",
  studentCompleteProfile: "/Student/complete-profile",
  studentDrives: "/Student/drives",
  studentNotifications: "/Student/notifications",
  studentAnnouncements: "/Student/announcements",

  spcVerification: "/SPC/verification",

  tpc: "/TPC",
  tpcVerification: "/TPC/verification",
  tpcSpcVerified: "/TPC/spc-verified",
  tpcStudents: "/TPC/students",
  tpcSpc: "/TPC/coordinators",
  tpcNotifications: "/TPC/notifications",
  tpcAccount: "/TPC/account",

  admin: "/Admin",
  adminCompanies: "/Admin/companies",
  adminDrives: "/Admin/drives",
  adminStudents: "/Admin/students",
  adminInvitations: "/Admin/invitations",
  adminPosts: "/Admin/posts",
  adminSpcs: "/Admin/spcs",
  adminTpcs: "/Admin/tpcs",
  adminAdmins: "/Admin/admins",
  adminNotifications: "/Admin/notifications",
  adminAccount: "/Admin/account",
} as const;

/** Purpose: where the topbar bell should navigate to, per role. All four roles now share the same NotificationsPage component - only the route prefix differs. */
export function notificationsPathForRole(role: Role | null): string | null {
  switch (role) {
    case "student":
    case "spc":
      return paths.studentNotifications;
    case "tpc":
      return paths.tpcNotifications;
    case "admin":
      return paths.adminNotifications;
    default:
      return null;
  }
}

/** Purpose: where "View profile" in the topbar's account menu should go, per
 * role. Student/SPC already have a real document-driven profile page;
 * TPC/Admin get the lighter generic AccountPage since they have no student
 * record to show. */
export function accountPathForRole(role: Role | null): string | null {
  switch (role) {
    case "student":
    case "spc":
      return paths.studentProfile;
    case "tpc":
      return paths.tpcAccount;
    case "admin":
      return paths.adminAccount;
    default:
      return null;
  }
}

/** Purpose: where to land a freshly-authenticated user (or anyone hitting a route their role can't see), based on their role. */
export function homePathForRole(role: Role | null): string {
  switch (role) {
    case "student":
      return paths.student;
    case "spc":
      // An SPC is also a student: they land on the student dashboard and reach
      // their verification queue from the sidebar.
      return paths.student;
    case "tpc":
      return paths.tpc;
    case "admin":
      return paths.admin;
    default:
      return paths.login;
  }
}
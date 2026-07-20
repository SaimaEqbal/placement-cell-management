import { Navigate, Route, Routes } from "react-router-dom";

import AppShellLayout from "../components/layouts/AppShellLayout";
import { useAuth } from "../context/AuthContext";

import LoginPage from "../pages/auth/LoginPage";
import RegistrationPage from "../pages/auth/RegistrationPage";
import InviteRegisterPage from "../pages/auth/InviteRegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

import StudentDashboard from "../pages/student/StudentDashboard";
import ProfilePage from "../pages/student/ProfilePage";
import CompleteProfilePage from "../pages/student/CompleteProfilePage";
import PlacementDrivesPage from "../pages/student/PlacementDrivesPage";
import NotificationsPage from "../pages/student/NotificationsPage";
import AnnouncementsPage from "../pages/student/AnnouncementsPage";

import SpcVerificationQueuePage from "../pages/spc/SpcVerificationQueuePage";
import StudentVerificationDetailPage from "../pages/spc/StudentVerificationDetailPage";

import TpcDashboard from "../pages/tpc/TpcDashboard";
import TpcVerificationQueuePage from "../pages/tpc/TpcVerificationQueuePage";
import TpcSpcVerifiedPage from "../pages/tpc/TpcSpcVerifiedPage";
import TpcStudentsPage from "../pages/tpc/TpcStudentsPage";
import TpcSpcPage from "../pages/tpc/TpcSpcPage";

import AdminDashboard from "../pages/admin/AdminDashboard";
import CompaniesPage from "../pages/admin/CompaniesPage";
import DrivesPage from "../pages/admin/DrivesPage";
import DriveStudentsPage from "../pages/admin/DriveStudentsPage";
import AdminStudentsPage from "../pages/admin/AdminStudentsPage";
import InvitationsPage from "../pages/admin/InvitationsPage";
import CompanyPostsPage from "../pages/admin/CompanyPostsPage";
import AdminSpcsPage from "../pages/admin/AdminSpcsPage";
import AdminTpcsPage from "../pages/admin/AdminTpcsPage";
import AdminAdminsPage from "../pages/admin/AdminAdminsPage";

import { homePathForRole, paths } from "./paths";
import ProtectedRoute from "./ProtectedRoute";

/** Purpose: the single source of truth for every route in the app - which URL renders which page, and which roles may see it. See src/routes/paths.ts for the path constants and ProtectedRoute.tsx for the access-control logic. */
export default function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public routes  */}
      <Route
        path={paths.login}
        element={
          isAuthenticated ? (
            <Navigate to={homePathForRole(role)} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path={paths.register}
        element={
          isAuthenticated ? (
            <Navigate to={homePathForRole(role)} replace />
          ) : (
            <RegistrationPage />
          )
        }
      />
      {/* Invite-acceptance link (public): an invited TPC/Admin/SPC self-registers.
          Kept distinct from /register (student signup) and outside ProtectedRoute
          since the invitee is logged out. */}
      <Route path={paths.inviteRegister} element={<InviteRegisterPage />} />
      <Route path={paths.verifyEmail} element={<VerifyEmailPage />} />
      <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={paths.resetPassword} element={<ResetPasswordPage />} />

      {/* Student routes. An SPC is also a student, so "spc" is allowed here too -
          they see all the normal student pages plus their SPC verification queue. */}
      <Route element={<ProtectedRoute allowedRoles={["student", "spc"]} />}>
        <Route element={<AppShellLayout />}>
          <Route path={paths.student} element={<StudentDashboard />} />
          <Route path={paths.studentProfile} element={<ProfilePage />} />
          <Route
            path={paths.studentCompleteProfile}
            element={<CompleteProfilePage />}
          />
          <Route path={paths.studentDrives} element={<PlacementDrivesPage />} />
          <Route
            path={paths.studentNotifications}
            element={<NotificationsPage />}
          />
          <Route
            path={paths.studentAnnouncements}
            element={<AnnouncementsPage />}
          />
        </Route>
      </Route>

      {/* SPC routes: the SPC-only verification queue + review detail. (The SPC
          dashboard/roster were removed - an SPC uses the student pages above.) */}
      <Route element={<ProtectedRoute allowedRoles={["spc"]} />}>
        <Route element={<AppShellLayout />}>
          <Route
            path={paths.spcVerification}
            element={<SpcVerificationQueuePage />}
          />
          <Route
            path={`${paths.spcVerification}/:studentId`}
            element={<StudentVerificationDetailPage role="SPC" />}
          />
        </Route>
      </Route>

      {/* TPC routes */}
      <Route element={<ProtectedRoute allowedRoles={["tpc"]} />}>
        <Route element={<AppShellLayout />}>
          <Route path={paths.tpc} element={<TpcDashboard />} />

          {/* Verification queue: students the SPC rejected (spc_rejected). */}
          <Route
            path={paths.tpcVerification}
            element={<TpcVerificationQueuePage />}
          />
          <Route
            path={`${paths.tpcVerification}/:studentId`}
            element={<StudentVerificationDetailPage role="TPC" />}
          />

          {/* Awaiting TPC verification: SPC-verified students + SPC coordinators. */}
          <Route path={paths.tpcSpcVerified} element={<TpcSpcVerifiedPage />} />

          {/* Department roster: promote/demote/delete management. */}
          <Route path={paths.tpcStudents} element={<TpcStudentsPage />} />
          <Route
            path={`${paths.tpcStudents}/:studentId`}
            element={<StudentVerificationDetailPage role="TPC" mode="manage" />}
          />

          {/* SPC management + assignment. */}
          <Route path={paths.tpcSpc} element={<TpcSpcPage />} />

          <Route path={paths.tpcNotifications} element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* UPC/Admin routes  */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AppShellLayout />}>
          <Route path={paths.admin} element={<AdminDashboard />} />
          <Route path={paths.adminCompanies} element={<CompaniesPage />} />
          <Route path={paths.adminDrives} element={<DrivesPage />} />
          <Route
            path={`${paths.adminDrives}/:driveId`}
            element={<DriveStudentsPage />}
          />
          <Route path={paths.adminStudents} element={<AdminStudentsPage />} />
          <Route
            path={`${paths.adminStudents}/:studentId`}
            element={<StudentVerificationDetailPage mode="view" />}
          />
          <Route path={paths.adminInvitations} element={<InvitationsPage />} />
          <Route path={paths.adminPosts} element={<CompanyPostsPage />} />
          <Route path={paths.adminSpcs} element={<AdminSpcsPage />} />
          <Route path={paths.adminTpcs} element={<AdminTpcsPage />} />
          <Route path={paths.adminAdmins} element={<AdminAdminsPage />} />
          <Route path={paths.adminNotifications} element={<NotificationsPage />} />
        </Route>
      </Route>

      {/*  Fallbacks  */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? homePathForRole(role) : paths.login}
            replace
          />
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? homePathForRole(role) : paths.login}
            replace
          />
        }
      />
    </Routes>
  );
}

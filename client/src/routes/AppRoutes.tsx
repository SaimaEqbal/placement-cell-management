import { Navigate, Route, Routes } from "react-router-dom";

import AppShellLayout from "../components/layouts/AppShellLayout";
import { useAuth } from "../context/AuthContext";

import LoginPage from "../pages/auth/LoginPage";
import RegistrationPage from "../pages/auth/RegistrationPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

import StudentDashboard from "../pages/student/StudentDashboard";
import ProfilePage from "../pages/student/ProfilePage";
import CompleteProfilePage from "../pages/student/CompleteProfilePage";
import PlacementDrivesPage from "../pages/student/PlacementDrivesPage";
import NotificationsPage from "../pages/student/NotificationsPage";

import SpcDashboard from "../pages/spc/SpcDashboard";
import SpcStudentsPage from "../pages/spc/SpcStudentsPage";
import SpcVerificationQueuePage from "../pages/spc/SpcVerificationQueuePage";
import StudentVerificationDetailPage from "../pages/spc/StudentVerificationDetailPage";

import TpcDashboard from "../pages/tpc/TpcDashboard";
import TpcVerificationQueuePage from "../pages/tpc/TpcVerificationQueuePage";

import AdminDashboard from "../pages/admin/AdminDashboard";
import CompaniesPage from "../pages/admin/CompaniesPage";
import DrivesPage from "../pages/admin/DrivesPage";
import AdminStudentsPage from "../pages/admin/AdminStudentsPage";

import { homePathForRole, paths } from "./paths";
import ProtectedRoute from "./ProtectedRoute";

/* Purpose: the single source of truth for every route in the app - which URL renders which page, and which roles may see it. See src/routes/paths.ts for the path constants and ProtectedRoute.tsx for the access-control logic.*/
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
      <Route path={paths.verifyEmail} element={<VerifyEmailPage />} />
      <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={paths.resetPassword} element={<ResetPasswordPage />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
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
        </Route>
      </Route>

      {/*  SPC routes */}
      <Route element={<ProtectedRoute allowedRoles={["spc"]} />}>
        <Route element={<AppShellLayout />}>
          <Route path={paths.spc} element={<SpcDashboard />} />
          <Route path={paths.spcStudents} element={<SpcStudentsPage />} />
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

      {/*TPC routes */}
      <Route element={<ProtectedRoute allowedRoles={["tpc"]} />}>
        <Route element={<AppShellLayout />}>
          <Route path={paths.tpc} element={<TpcDashboard />} />
          <Route
            path={paths.tpcVerification}
            element={<TpcVerificationQueuePage />}
          />
          <Route
            path={`${paths.tpcVerification}/:studentId`}
            element={<StudentVerificationDetailPage role="TPC" />}
          />
        </Route>
      </Route>

      {/* UPC/Admin routes  */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AppShellLayout />}>
          <Route path={paths.admin} element={<AdminDashboard />} />
          <Route path={paths.adminCompanies} element={<CompaniesPage />} />
          <Route path={paths.adminDrives} element={<DrivesPage />} />
          <Route path={paths.adminStudents} element={<AdminStudentsPage />} />
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

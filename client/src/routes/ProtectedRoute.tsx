import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { homePathForRole, paths } from "./paths";

/** Purpose: gate a subtree of routes (rendered via <Outlet/>) behind authentication, and optionally a specific set of roles. - Not signed in -> redirect to /login, remembering where they were headed. - Signed in but wrong role -> redirect to that user's own dashboard instead of letting them see another role's pages. - Otherwise -> render the matched child route. */

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <Outlet />;
}

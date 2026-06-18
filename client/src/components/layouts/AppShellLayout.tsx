import { Outlet } from "react-router-dom";

import Sidebar from "../Sidebar";

/**
 * Purpose: shared <Sidebar/> + .app-shell/.app-main chrome for every
 * authenticated role's pages, rendered once per role section via nested
 * routes (see src/routes/AppRoutes.tsx) instead of each page re-rendering
 * its own copy of this markup, which is what StudentDashboard/SpcDashboard/
 * VerificationPage used to do individually.
 */
export default function AppShellLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

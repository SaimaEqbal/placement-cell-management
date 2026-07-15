import { Outlet } from "react-router-dom";

import Sidebar from "../Sidebar";

/**
 * Shared shell for every authenticated role: a fixed sidebar on lg+ screens and
 * a scrollable main column. On smaller screens the sidebar collapses and its
 * navigation is reached through the Topbar's mobile drawer. Rendered once per
 * role section via nested routes (see src/routes/AppRoutes.tsx).
 */
export default function AppShellLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { paths } from "../routes/paths";
import SidebarNav from "./dashboard/SidebarNav";

/**
 * Purpose: sticky page header showing a title/subtitle the page provides, plus a
 * role-aware (or caller-supplied) avatar. On small screens it also hosts the
 * hamburger that opens the navigation drawer, since the sidebar rail is hidden.
 */
export default function Topbar({
  title,
  subtitle,
  initials,
}: {
  title: string;
  subtitle: string;
  /** Optional override, e.g. initials derived from the loaded profile's name. Falls back to the signed-in role's initials. */
  initials?: string;
}) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const displayInitials = initials ?? (role ? role.slice(0, 2).toUpperCase() : "??");
  // Only students have a notifications page today (see routes/paths.ts).
  // useNotifications shares its react-query cache/key with NotificationsPage,
  // so this doesn't add an extra network request when both are mounted -
  // it's disabled entirely for roles without a notifications route yet.
  // An SPC is also a student, so both roles have a notifications page + bell.
  const canSeeNotifications = role === "student" || role === "spc";
  const { data: notifications } = useNotifications({ enabled: canSeeNotifications });
  const hasUnread = (notifications?.some((n) => !n.read)) ?? false;

  const handleBellClick = () => {
    if (canSeeNotifications) {
      navigate(paths.studentNotifications);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="grid size-9 shrink-0 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Application navigation menu
          </SheetDescription>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground md:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative grid size-9 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          aria-label="Notifications"
          onClick={handleBellClick}
          disabled={!canSeeNotifications}
        >
          <Bell className="size-4" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </button>
        <div className="grid size-9 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {displayInitials}
        </div>
      </div>
    </header>
  );
}

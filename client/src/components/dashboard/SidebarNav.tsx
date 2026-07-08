import { type ElementType } from "react";
import { NavLink } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Newspaper,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { paths } from "../../routes/paths";
import type { Role } from "../../types";

interface NavItem {
  label: string;
  to: string;
  icon: ElementType;
}

/** The normal student navigation. Shared by the student role and the SPC role
 * (an SPC is also a student), so it is defined once and reused below. */
const studentNav: NavItem[] = [
  { label: "Dashboard", to: paths.student, icon: LayoutDashboard },
  { label: "My profile", to: paths.studentProfile, icon: FileText },
  { label: "Placement drives", to: paths.studentDrives, icon: Megaphone },
  { label: "Announcements", to: paths.studentAnnouncements, icon: Newspaper },
];

/**
 * Which nav items show up for each role. Driven by the route table in
 * src/routes/paths.ts, so adding a page there and here is the only wiring a new
 * sidebar link needs.
 */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: studentNav,
  spc: [
    ...studentNav,
    { label: "Verification queue", to: paths.spcVerification, icon: ClipboardCheck },
  ],
  tpc: [
    { label: "Dashboard", to: paths.tpc, icon: LayoutDashboard },
    { label: "Verification queue", to: paths.tpcVerification, icon: ClipboardCheck },
    { label: "Awaiting TPC review", to: paths.tpcSpcVerified, icon: CheckCircle2 },
    { label: "Students", to: paths.tpcStudents, icon: Users },
    { label: "SPCs", to: paths.tpcSpc, icon: UserCog },
  ],
  admin: [
    { label: "Dashboard", to: paths.admin, icon: LayoutDashboard },
    { label: "Companies", to: paths.adminCompanies, icon: Building2 },
    { label: "Drives", to: paths.adminDrives, icon: Megaphone },
    { label: "Students", to: paths.adminStudents, icon: Users },
    { label: "Invitations", to: paths.adminInvitations, icon: UserPlus },
    { label: "Posts", to: paths.adminPosts, icon: Newspaper },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  spc: "SPC Coordinator",
  tpc: "TPC Administrator",
  admin: "Placement Cell Admin",
};

/**
 * Role-aware navigation body: brand, the signed-in role summary, the nav links,
 * and sign-out. Rendered both in the fixed desktop rail (Sidebar) and inside the
 * mobile drawer (Topbar's Sheet); `onNavigate` lets the drawer close on tap.
 */
export default function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { role, user, logout } = useAuth();
  const nav = role ? NAV_BY_ROLE[role] : [];
  const initials = role ? role.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2.5 px-2 pt-1">
        <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Landmark className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">
            Placement Cell
          </div>
          <div className="text-xs text-muted-foreground">
            Jamia Millia Islamia
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
          {initials}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium">
            {role ? ROLE_LABEL[role] : "Account"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user ? `ID ${user.id.slice(0, 8)}` : ""}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4 shrink-0" /> Sign out
      </button>
    </div>
  );
}

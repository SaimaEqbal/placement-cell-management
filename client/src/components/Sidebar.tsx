import { type ElementType } from "react";
import { NavLink } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Newspaper,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import Brand from "./Brand";
import { useAuth } from "../context/AuthContext";
import { paths } from "../routes/paths";
import type { Role } from "../types";

interface NavItem {
  label: string;
  to: string;
  icon: ElementType;
}

/** The normal student navigation. Shared by the student role and the SPC role
 * (an SPC is also a student), so it is defined once and reused below. */
const studentNav: NavItem[] = [
  { label: "Overview", to: paths.student, icon: LayoutDashboard },
  { label: "My profile", to: paths.studentProfile, icon: FileText },
  { label: "Placement drives", to: paths.studentDrives, icon: Megaphone },
  { label: "Announcements", to: paths.studentAnnouncements, icon: Newspaper },
];

/**
 * Purpose: which nav items show up for each role. Driven entirely by the
 * route table in src/routes/paths.ts, so adding a page there and here is the
 * only wiring a new sidebar link needs.
 */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: studentNav,
  // SPC = student pages + a single verification queue (their only extra duty).
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
 * Purpose: role-aware left navigation rail shown on every authenticated
 * page. Reads the active role and signed-in user straight from AuthContext
 * and the active link from the current URL (via NavLink), so pages no
 * longer need to pass `role`/`active`/`go` props down to it.
 */
export default function Sidebar() {
  const { role, user, logout } = useAuth();
  const nav = role ? NAV_BY_ROLE[role] : [];
  const initials = role ? role.slice(0, 2).toUpperCase() : "??";

  return (
    <aside className="sidebar">
      <Brand />
      <div className="side-role">
        <span>{initials}</span>
        <div>
          <b>{role ? ROLE_LABEL[role] : "Account"}</b>
          <small>{user ? `ID ${user.id.slice(0, 8)}` : ""}</small>
        </div>
      </div>
      <nav>
        {nav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="side-bottom">
        <button type="button" onClick={logout}>
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}

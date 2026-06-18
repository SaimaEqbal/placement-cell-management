import { Bell, Search } from "lucide-react";

import { useAuth } from "../context/AuthContext";

/**
 * Purpose: page header showing a title/subtitle the page provides, plus a
 * role-aware (or caller-supplied, e.g. the student's real name) avatar -
 * replaces the previously hardcoded "JD" placeholder.
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
  const displayInitials = initials ?? (role ? role.slice(0, 2).toUpperCase() : "??");

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <button type="button" className="icon-btn" aria-label="Search">
          <Search size={18} />
        </button>
        <button type="button" className="icon-btn dot" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="top-avatar">{displayInitials}</div>
      </div>
    </header>
  );
}

import { Bell, Search } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "../hooks/useNotifications";
import { paths } from "../routes/paths";

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
   const navigate = useNavigate();
  const displayInitials = initials ?? (role ? role.slice(0, 2).toUpperCase() : "??");
  // Only students have a notifications page today (see routes/paths.ts).
  // useNotifications shares its react-query cache/key with NotificationsPage,
  // so this doesn't add an extra network request when both are mounted -
  // it's disabled entirely for roles without a notifications route yet.
  const { data: notifications } = useNotifications({ enabled: role === "student" });
  const hasUnread = (notifications?.some((n) => !n.read)) ?? false;

  const handleBellClick = () => {
    if (role === "student") {
      navigate(paths.studentNotifications);
    }
  };

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
        <button
          type="button"
          className={`icon-btn${hasUnread ? " dot" : ""}`}
          aria-label="Notifications"
          onClick={handleBellClick}
          disabled={role !== "student"}
        >
          <Bell size={18} />
        </button>
        <div className="top-avatar">{displayInitials}</div>
      </div>
    </header>
  );
}

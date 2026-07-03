import { Bell, CheckCheck } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Activity, Badge, EmptyState, LoadingState } from "../../components/ui";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";
import { formatDate } from "../../lib/format";

import "../../styles/dashboard.css";

/**
 * Purpose: /Student/notifications - the signed-in user's personal notification
 * feed (opened from the topbar bell). Backed by useNotifications() + the
 * /notifications API; supports per-item and bulk "mark as read". Company
 * announcements live on the separate Announcements page (AnnouncementsPage.tsx).
 */
export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <>
      <Topbar title="Notifications" subtitle="Updates about your profile and placement drives." />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading notifications..." />}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <EmptyState
            icon={<Bell size={28} />}
            title="No notifications yet"
            description="You'll see placement and verification updates here."
          />
        )}

        {!isLoading && notifications && notifications.length > 0 && (
          <section className="panel">
            <div className="panel-head">
              <h2>
                Recent activity{" "}
                {unreadCount > 0 && <Badge tone="amber">{unreadCount} unread</Badge>}
              </h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck size={12} />
                  {markAllRead.isPending ? "Marking..." : "Mark all read"}
                </button>
              )}
            </div>
            <div className="panel-body">
              {notifications.map((notification) => (
                <Activity
                  key={notification.id}
                  title={notification.title}
                  meta={`${notification.message} · ${formatDate(notification.createdAt)}`}
                  tone={notification.tone}
                  className={notification.read ? undefined : "is-unread"}
                  onClick={
                    notification.read ? undefined : () => markRead.mutate(notification.id)
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

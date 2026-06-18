import { Bell } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Activity, EmptyState, LoadingState } from "../../components/ui";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDate } from "../../lib/format";

import "../../styles/dashboard.css";

/**
 * Purpose: /Student/notifications - lists the signed-in student's
 * notifications via useNotifications() (currently mock data per the brief -
 * "Mock data is acceptable initially" - see notificationService.ts).
 */
export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();

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
              <h2>Recent activity</h2>
            </div>
            <div className="panel-body">
              {notifications.map((notification) => (
                <Activity
                  key={notification.id}
                  title={notification.title}
                  meta={`${notification.message} · ${formatDate(notification.createdAt)}`}
                  tone={notification.tone}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

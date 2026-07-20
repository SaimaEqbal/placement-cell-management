import type { ReactNode } from "react";
import { Bell, CheckCheck, CheckCircle2, Clock, FileText, Trash2, XCircle } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { FeedItem } from "@/components/dashboard/FeedItem";
import { EmptyState, LoadingState } from "@/components/dashboard/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useClearAllNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";
import { formatDate } from "../../lib/format";
import type { StatusTone } from "../../types";

/** Presentational icon for a notification's tone. */
function iconForTone(tone: StatusTone): ReactNode {
  switch (tone) {
    case "green":
      return <CheckCircle2 />;
    case "red":
      return <XCircle />;
    case "amber":
      return <Clock />;
    case "blue":
      return <Bell />;
    default:
      return <FileText />;
  }
}

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
  const clearAll = useClearAllNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleClearAll = () => {
    if (window.confirm("Clear all notifications? This can't be undone.")) {
      clearAll.mutate();
    }
  };

  return (
    <>
      <Topbar title="Notifications" subtitle="Updates about your profile and placement drives." />
      <PageContainer>
        {isLoading && <LoadingState label="Loading notifications..." />}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <EmptyState
            icon={<Bell />}
            title="No notifications yet"
            description="You'll see placement and verification updates here."
          />
        )}

        {!isLoading && notifications && notifications.length > 0 && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                Recent activity
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} unread</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                  >
                    <CheckCheck />
                    {markAllRead.isPending ? "Marking..." : "Mark all read"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleClearAll}
                  disabled={clearAll.isPending}
                >
                  <Trash2 />
                  {clearAll.isPending ? "Clearing..." : "Clear all"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-6">
              {notifications.map((notification) => (
                <FeedItem
                  key={notification.id}
                  icon={iconForTone(notification.tone)}
                  title={notification.title}
                  meta={`${notification.message} · ${formatDate(notification.createdAt)}`}
                  unread={!notification.read}
                  onClick={
                    notification.read
                      ? undefined
                      : () => markRead.mutate(notification.id)
                  }
                />
              ))}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}

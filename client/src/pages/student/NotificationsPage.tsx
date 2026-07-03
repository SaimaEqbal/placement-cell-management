<<<<<<< HEAD
import { Megaphone } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Activity, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useCompanyPosts } from "../../hooks/useCompanyPosts";
=======
import { Bell, CheckCheck } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Activity, Badge, EmptyState, LoadingState } from "../../components/ui";
import { useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,} from "../../hooks/useNotifications";
>>>>>>> 83911f696eae2f6861aaf2bb9787ab8a194c5a44
import { formatDate } from "../../lib/format";
import type { StatusTone } from "../../types";

import "../../styles/dashboard.css";

/** Purpose: presentational tone for a post category. */
function postTone(postType: string | null): StatusTone {
  return postType === "email" ? "gray" : "blue";
}

/**
 * Purpose: /Student/notifications - a read-only feed of company posts
 * (announcements / emails) from GET /company-post. Replaces the earlier mock
 * notifications with the real, backend-backed posts any authenticated role can
 * read.
 */
export default function NotificationsPage() {
<<<<<<< HEAD
  const { data: posts, isLoading, isError, error, refetch } = useCompanyPosts();

  return (
=======
  const { data: notifications, isLoading } = useNotifications();
const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
    const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;
   return (
>>>>>>> 83911f696eae2f6861aaf2bb9787ab8a194c5a44
    <>
      <Topbar
        title="Announcements"
        subtitle="Updates and announcements from the placement cell."
      />
      <div className="dashboard-content">
        {isLoading && <LoadingState label="Loading announcements..." />}

        {isError && (
          <ErrorState
            message={error?.message ?? "Could not load announcements."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <EmptyState
            icon={<Megaphone size={28} />}
            title="No announcements yet"
            description="Placement cell announcements will show up here."
          />
        )}

        {!isLoading && !isError && posts && posts.length > 0 && (
          <section className="panel">
            <div className="panel-head">
<<<<<<< HEAD
              <h2>Recent announcements</h2>
=======
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
>>>>>>> 83911f696eae2f6861aaf2bb9787ab8a194c5a44
            </div>
            <div className="panel-body">
              {posts.map((post) => (
                <Activity
<<<<<<< HEAD
                  key={post.post_id}
                  title={post.title}
                  meta={`${post.content} · ${formatDate(post.created_at)}`}
                  tone={postTone(post.post_type)}
=======
                  key={notification.id}
                  title={notification.title}
                  meta={`${notification.message} · ${formatDate(notification.createdAt)}`}
                  tone={notification.tone}
                  className={notification.read ? undefined : "is-unread"}
                  onClick={
                    notification.read
                      ? undefined
                      : () => markRead.mutate(notification.id)
                  }
>>>>>>> 83911f696eae2f6861aaf2bb9787ab8a194c5a44
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
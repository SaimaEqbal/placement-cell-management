import { Megaphone } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Activity, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useCompanyPosts } from "../../hooks/useCompanyPosts";
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
  const { data: posts, isLoading, isError, error, refetch } = useCompanyPosts();

  return (
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
              <h2>Recent announcements</h2>
            </div>
            <div className="panel-body">
              {posts.map((post) => (
                <Activity
                  key={post.post_id}
                  title={post.title}
                  meta={`${post.content} · ${formatDate(post.created_at)}`}
                  tone={postTone(post.post_type)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

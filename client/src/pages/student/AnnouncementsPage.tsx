import { Mail, Megaphone } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { FeedItem } from "@/components/dashboard/FeedItem";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompanyPosts } from "../../hooks/useCompanyPosts";
import { formatDate } from "../../lib/format";

/**
 * Purpose: /Student/announcements - a read-only feed of company posts
 * (announcements / emails) from GET /company-post. This is the placement
 * cell's broadcast channel; personal notifications live on the separate
 * Notifications page (opened from the topbar bell).
 */
export default function AnnouncementsPage() {
  const { data: posts, isLoading, isError, error, refetch } = useCompanyPosts();

  return (
    <>
      <Topbar
        title="Announcements"
        subtitle="Updates and announcements from the placement cell."
      />
      <PageContainer>
        {isLoading && <LoadingState label="Loading announcements..." />}

        {isError && (
          <ErrorState
            message={error?.message ?? "Could not load announcements."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <EmptyState
            icon={<Megaphone />}
            title="No announcements yet"
            description="Placement cell announcements will show up here."
          />
        )}

        {!isLoading && !isError && posts && posts.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Recent announcements</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-6">
              {posts.map((post) => (
                <FeedItem
                  key={post.post_id}
                  icon={post.post_type === "email" ? <Mail /> : <Megaphone />}
                  title={post.title}
                  meta={`${post.content} · ${formatDate(post.created_at)}`}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}

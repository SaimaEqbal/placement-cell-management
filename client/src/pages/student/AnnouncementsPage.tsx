import { Megaphone } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { AnnouncementViewer } from "@/components/dashboard/AnnouncementViewer";
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
 * Purpose: /Student/announcements - a read-only feed of announcements from GET
 * /company-post. Each announcement is rendered with the shared AnnouncementViewer
 * (Title / Content / named attachment actions that open the shared preview pane),
 * so students never see raw Drive URLs. This is the placement cell's broadcast
 * channel; personal notifications live on the separate Notifications page.
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
            <CardContent className="flex flex-col divide-y pt-0">
              {posts.map((post) => (
                <div key={post.post_id} className="flex flex-col gap-2 py-6 first:pt-6">
                  <AnnouncementViewer post={post} />
                  <p className="text-xs text-muted-foreground">
                    Posted {formatDate(post.created_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}

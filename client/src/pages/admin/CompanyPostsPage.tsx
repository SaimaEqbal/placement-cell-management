import { useState } from "react";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { AnnouncementFormDialog } from "@/components/dashboard/AnnouncementFormDialog";
import { AttachmentPreviewList } from "@/components/dashboard/AttachmentPreviewList";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCompanyPosts,
  useDeletePost,
} from "../../hooks/useCompanyPosts";
import { formatDate } from "../../lib/format";
import type { CompanyPostRecord } from "../../services/companyPostService";

/**
 * Purpose: /Admin/posts - Admin management of announcements (GET/POST/PUT/DELETE
 * /company-post). Each announcement carries its attachments (pasted Drive links)
 * inline: they are edited with the shared AnnouncementFormDialog and previewed
 * with the shared AttachmentPreviewList.
 */
export default function CompanyPostsPage() {
  const { data: posts, isLoading, isError, error, refetch } = useCompanyPosts();
  const deleteMutation = useDeletePost();

  const [open, setOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CompanyPostRecord | null>(null);

  function openCreate() {
    setEditingPost(null);
    setOpen(true);
  }

  function openEdit(post: CompanyPostRecord) {
    setEditingPost(post);
    setOpen(true);
  }

  return (
    <>
      <Topbar title="Announcements" subtitle="Publish announcements to students." />
      <PageContainer>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Announcements</h2>
          <Button type="button" onClick={openCreate}>
            <Plus /> New announcement
          </Button>
        </div>

        {isLoading && <LoadingState label="Loading announcements..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load announcements."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <EmptyState
            icon={<Megaphone />}
            title="No announcements yet"
            description="Publish an announcement to get started."
          />
        )}

        {!isLoading && !isError && posts && posts.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <Card key={post.post_id}>
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <CardTitle className="min-w-0 truncate text-base">
                    {post.title}
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label="Edit announcement"
                      onClick={() => openEdit(post)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label="Delete announcement"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(post.post_id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {post.content}
                  </p>
                  <AttachmentPreviewList attachments={post.attachments} />
                  <p className="text-xs text-muted-foreground">
                    Posted {formatDate(post.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      <AnnouncementFormDialog
        open={open}
        onOpenChange={setOpen}
        editingPost={editingPost}
      />
    </>
  );
}

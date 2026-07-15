import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnnouncementViewer } from "./AnnouncementViewer";
import { ErrorState, LoadingState } from "./states";
import { useCompanyPost } from "@/hooks/useCompanyPosts";

/**
 * Purpose: the single reusable read-only announcement dialog. Fetches one
 * announcement by id (GET /company-post/:id) and renders it with the shared
 * AnnouncementViewer. Used by the student drives table and admin drive
 * management to view a drive-linked announcement — the exact same viewer as a
 * standalone announcement, so there is no drive-specific viewer.
 */
export function AnnouncementViewerDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: number | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: post,
    isLoading,
    isError,
    error,
    refetch,
  } = useCompanyPost(open && postId != null ? postId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Announcement</DialogTitle>
        </DialogHeader>

        {isLoading && <LoadingState label="Loading announcement..." />}
        {isError && (
          <ErrorState
            message={error?.message ?? "Could not load the announcement."}
            onRetry={refetch}
          />
        )}
        {!isLoading && !isError && post && <AnnouncementViewer post={post} />}
      </DialogContent>
    </Dialog>
  );
}

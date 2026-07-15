import { AttachmentPreviewList } from "./AttachmentPreviewList";
import type { CompanyPostRecord } from "@/services/companyPostService";

/**
 * Purpose: the single, reusable read-only announcement viewer — Title, Content,
 * then the named attachment actions (which open the shared preview pane). Used
 * by the student announcements feed and (Phase 2) the drive-linked announcement
 * dialog, so a drive announcement is shown exactly like any other announcement.
 */
export function AnnouncementViewer({ post }: { post: CompanyPostRecord }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-semibold tracking-tight">{post.title}</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
          {post.content}
        </p>
      </div>
      <AttachmentPreviewList attachments={post.attachments} />
    </div>
  );
}

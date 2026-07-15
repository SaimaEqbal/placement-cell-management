import { useState } from "react";
import { Eye, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentPreview } from "./DocumentPreview";
import type { PostAttachment } from "@/services/companyPostService";

/**
 * Purpose: the shared, read-only attachment viewer. Renders each attachment as a
 * named "View <name>" action (never a raw Drive URL); clicking one opens the
 * reusable DocumentPreview pane in a dialog. Used by the student announcements
 * feed, the admin posts manager, and (Phase 2) the drive-linked announcement
 * viewer, so every surface previews Drive links the same way.
 */
export function AttachmentPreviewList({
  attachments,
}: {
  attachments: PostAttachment[] | undefined;
}) {
  const [active, setActive] = useState<PostAttachment | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">Attachments</div>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <Button
            key={a.attachment_id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActive(a)}
          >
            <Eye /> View {a.file_name}
          </Button>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              {active?.file_name}
            </DialogTitle>
          </DialogHeader>
          {active && <DocumentPreview label={active.file_name} url={active.file_url} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

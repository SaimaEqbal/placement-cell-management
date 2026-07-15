import { useEffect, useState, type FormEvent } from "react";

import { Field } from "./Field";
import { AttachmentEditor } from "./AttachmentEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "@/api/apiError";
import { useCompanyPost, useCreatePost, useUpdatePost } from "@/hooks/useCompanyPosts";
import type {
  CompanyPostRecord,
  CreatePostPayload,
  PostAttachmentInput,
} from "@/services/companyPostService";

interface AnnouncementForm {
  title: string;
  content: string;
  attachments: PostAttachmentInput[];
}

const EMPTY: AnnouncementForm = { title: "", content: "", attachments: [] };

/** Flatten an ApiError's per-field validation errors into one readable line. */
function fieldErrorText(error: ApiError): string | undefined {
  if (!error.fieldErrors) return undefined;
  const msgs = Object.entries(error.fieldErrors).flatMap(([field, list]) =>
    list.map((m) => `${field}: ${m}`),
  );
  return msgs.length ? msgs.join(" · ") : undefined;
}

/**
 * Purpose: the single reusable announcement create/edit dialog (Title, Content,
 * shared AttachmentEditor). Used by the standalone announcements manager and by
 * drive management. To edit, pass `editingPost` (full record) or `editingPostId`
 * (fetched here); to create an announcement linked to a drive, pass `driveId`.
 * This is the ONE announcement editor — there is no drive-specific variant.
 */
export function AnnouncementFormDialog({
  open,
  onOpenChange,
  editingPost = null,
  editingPostId = null,
  driveId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost?: CompanyPostRecord | null;
  editingPostId?: number | null;
  driveId?: number;
  onSaved?: () => void;
}) {
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();

  // When only an id was given (edit from drive management), fetch the record.
  const fetched = useCompanyPost(
    open && !editingPost && editingPostId != null ? editingPostId : undefined,
  );
  const post = editingPost ?? fetched.data ?? null;
  const isEdit = editingPost != null || editingPostId != null;
  const mutation = isEdit ? updateMutation : createMutation;

  const [form, setForm] = useState<AnnouncementForm>(EMPTY);
  const [formError, setFormError] = useState<string>();

  // Hydrate from the post being edited (once loaded), or reset for a new one.
  useEffect(() => {
    if (!open) return;
    setFormError(undefined);
    if (post) {
      setForm({
        title: post.title,
        content: post.content,
        attachments: post.attachments.map((a) => ({
          file_name: a.file_name,
          file_url: a.file_url,
        })),
      });
    } else if (!isEdit) {
      setForm(EMPTY);
    }
  }, [open, post, isEdit]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) return setFormError("Title is required.");
    if (!content) return setFormError("Content is required.");

    const attachments = form.attachments.map((a) => ({
      file_name: a.file_name.trim(),
      file_url: a.file_url.trim(),
    }));
    if (attachments.some((a) => !a.file_name || !a.file_url)) {
      return setFormError("Each attachment needs both a name and a Google Drive URL.");
    }

    setFormError(undefined);

    if (isEdit) {
      if (!post) return;
      updateMutation.mutate(
        { id: post.post_id, payload: { title, content, attachments } },
        {
          onSuccess: () => {
            onSaved?.();
            onOpenChange(false);
          },
        },
      );
    } else {
      const payload: CreatePostPayload = { title, content, attachments };
      if (driveId !== undefined) payload.drive_id = driveId;
      createMutation.mutate(payload, {
        onSuccess: () => {
          onSaved?.();
          onOpenChange(false);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit announcement" : "New announcement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Field label="Title" htmlFor="ann-title">
            <Input
              id="ann-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Content" htmlFor="ann-content">
            <Textarea
              id="ann-content"
              className="min-h-28"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </Field>

          <AttachmentEditor
            value={form.attachments}
            onChange={(attachments) => setForm({ ...form, attachments })}
          />

          {(formError || mutation.isError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {formError ??
                  (mutation.error
                    ? fieldErrorText(mutation.error) ?? mutation.error.message
                    : undefined)}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || (isEdit && !post)}>
              {mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Publish announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

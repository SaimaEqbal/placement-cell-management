import { useState, type FormEvent } from "react";
import { Megaphone, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";

import Topbar from "../../components/Topbar";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { Field } from "@/components/dashboard/Field";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "../../api/apiError";
import {
  useCompanyPosts,
  useCreatePost,
  useDeleteAttachment,
  useDeletePost,
  usePostAttachments,
  useUpdatePost,
} from "../../hooks/useCompanyPosts";
import { formatDate } from "../../lib/format";
import type {
  CompanyPostRecord,
  CreatePostPayload,
  PostType,
} from "../../services/companyPostService";

const POST_TYPES: PostType[] = ["announcement", "email"];

const EMPTY_FORM: CreatePostPayload = {
  title: "",
  content: "",
  post_type: "announcement",
};

/** Purpose: flatten an ApiError's per-field validation errors into one readable line. */
function fieldErrorText(error: ApiError): string | undefined {
  if (!error.fieldErrors) return undefined;
  const msgs = Object.entries(error.fieldErrors).flatMap(([field, list]) =>
    list.map((m) => `${field}: ${m}`),
  );
  return msgs.length ? msgs.join(" · ") : undefined;
}

/**
 * Purpose: a post's attachments - a read-only list with delete. Uploading isn't
 * supported (the backend route has no multipart handler yet), so there's no add
 * control here.
 */
function PostAttachmentsPanel({ postId }: { postId: number }) {
  const { data: attachments, isLoading, isError, error } = usePostAttachments(postId);
  const deleteAttachment = useDeleteAttachment(postId);

  if (isLoading) return <LoadingState label="Loading attachments..." />;
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {error?.message ?? "Could not load attachments."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Paperclip className="size-3.5" /> Attachments (upload isn't available yet)
      </p>
      {!attachments || attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments.</p>
      ) : (
        attachments.map((a) => (
          <div
            key={a.attachment_id}
            className="flex items-center gap-3 rounded-lg border p-2.5"
          >
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <a
                href={a.file_url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                {a.file_name ?? "attachment"}
              </a>
              <div className="text-xs text-muted-foreground">
                {(a.mime_type ?? "file")} · {formatDate(a.uploaded_at)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Delete attachment"
              className="text-muted-foreground hover:text-destructive"
              disabled={deleteAttachment.isPending}
              onClick={() => deleteAttachment.mutate(a.attachment_id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * Purpose: /Admin/posts - Admin management of company posts (announcements /
 * emails) backed by GET/POST/PUT/DELETE /company-post, with each post's
 * attachments viewable and deletable inline.
 */
export default function CompanyPostsPage() {
  const { data: posts, isLoading, isError, error, refetch } = useCompanyPosts();
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();
  const deleteMutation = useDeletePost();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreatePostPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string>();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const mutation = editingId !== null ? updateMutation : createMutation;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(undefined);
    setOpen(true);
  }

  function openEdit(post: CompanyPostRecord) {
    setEditingId(post.post_id);
    setForm({
      title: post.title,
      content: post.content,
      post_type: post.post_type ?? "announcement",
    });
    setFormError(undefined);
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) return setFormError("Title is required.");
    if (!content) return setFormError("Content is required.");

    setFormError(undefined);
    const payload: CreatePostPayload = { title, content, post_type: form.post_type };

    if (editingId !== null) {
      updateMutation.mutate(
        { id: editingId, payload },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  }

  return (
    <>
      <Topbar title="Posts" subtitle="Publish announcements and emails to students." />
      <PageContainer>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Posts</h2>
          <Button type="button" onClick={openCreate}>
            <Plus /> New post
          </Button>
        </div>

        {isLoading && <LoadingState label="Loading posts..." />}
        {isError && (
          <ErrorState message={error?.message ?? "Could not load posts."} onRetry={refetch} />
        )}

        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <EmptyState
            icon={<Megaphone />}
            title="No posts yet"
            description="Publish an announcement or email to get started."
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
                    <StatusBadge tone={post.post_type === "email" ? "gray" : "blue"}>
                      {post.post_type ?? "announcement"}
                    </StatusBadge>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label="Edit post"
                      onClick={() => openEdit(post)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label="Delete post"
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
                  <p className="text-xs text-muted-foreground">
                    Posted {formatDate(post.created_at)}
                  </p>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() =>
                        setExpandedId(expandedId === post.post_id ? null : post.post_id)
                      }
                    >
                      <Paperclip />
                      {expandedId === post.post_id ? "Hide attachments" : "Attachments"}
                    </Button>
                  </div>
                  {expandedId === post.post_id && (
                    <PostAttachmentsPanel postId={post.post_id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit post" : "New post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="post-title">
                <Input
                  id="post-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <Field label="Type" htmlFor="post-type">
                <Select
                  value={form.post_type}
                  onValueChange={(value) =>
                    setForm({ ...form, post_type: value as PostType })
                  }
                >
                  <SelectTrigger id="post-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Content" htmlFor="post-content">
              <Textarea
                id="post-content"
                className="min-h-28"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>

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
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Publish post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

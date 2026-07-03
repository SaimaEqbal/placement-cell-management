import { useState, type FormEvent } from "react";
import { Megaphone, Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";

import Topbar from "../../components/Topbar";
import { Badge, EmptyState, ErrorState, LoadingState } from "../../components/ui";
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

import "../../styles/dashboard.css";
import "../../styles/form-wizard.css";

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
      <p className="field-error">{error?.message ?? "Could not load attachments."}</p>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
        <Paperclip size={12} /> Attachments (upload isn't available yet)
      </p>
      {!attachments || attachments.length === 0 ? (
        <p style={{ fontSize: 11, color: "var(--muted)" }}>No attachments.</p>
      ) : (
        attachments.map((a) => (
          <div className="activity" key={a.attachment_id}>
            <i className="blue">
              <Paperclip size={14} />
            </i>
            <div>
              <b>
                <a href={a.file_url} target="_blank" rel="noreferrer">
                  {a.file_name ?? "attachment"}
                </a>
              </b>
              <span>
                {(a.mime_type ?? "file")} · {formatDate(a.uploaded_at)}
              </span>
            </div>
            <button
              className="icon-btn"
              type="button"
              disabled={deleteAttachment.isPending}
              onClick={() => deleteAttachment.mutate(a.attachment_id)}
            >
              <Trash2 size={14} />
            </button>
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

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreatePostPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string>();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const mutation = editingId !== null ? updateMutation : createMutation;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(undefined);
    setShowForm(true);
  }

  function openEdit(post: CompanyPostRecord) {
    setEditingId(post.post_id);
    setForm({
      title: post.title,
      content: post.content,
      post_type: post.post_type ?? "announcement",
    });
    setFormError(undefined);
    setShowForm(true);
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
        { onSuccess: () => setShowForm(false) },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setShowForm(false) });
    }
  }

  return (
    <>
      <Topbar
        title="Posts"
        subtitle="Publish announcements and emails to students."
      />
      <div className="dashboard-content">
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-head">
            <h2>
              {showForm ? (editingId !== null ? "Edit post" : "New post") : "Posts"}
            </h2>
            <button
              className="secondary"
              type="button"
              onClick={() => (showForm ? setShowForm(false) : openCreate())}
            >
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? "Cancel" : "New post"}
            </button>
          </div>

          {showForm && (
            <div className="panel-body">
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  <label>
                    Title
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={form.post_type}
                      onChange={(e) =>
                        setForm({ ...form, post_type: e.target.value as PostType })
                      }
                    >
                      {POST_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    margin: "4px 0 18px",
                  }}
                >
                  Content
                  <textarea
                    style={{
                      width: "100%",
                      minHeight: 110,
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: "12px 13px",
                      marginTop: 7,
                      font: "inherit",
                      resize: "vertical",
                    }}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </label>

                {(formError || mutation.isError) && (
                  <span className="field-error">
                    {formError ??
                      (mutation.error
                        ? fieldErrorText(mutation.error) ?? mutation.error.message
                        : undefined)}
                  </span>
                )}
                <div className="form-actions">
                  <p />
                  <button
                    className="primary"
                    type="submit"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending
                      ? "Saving..."
                      : editingId !== null
                        ? "Save changes"
                        : "Publish post"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {isLoading && <LoadingState label="Loading posts..." />}
        {isError && (
          <ErrorState
            message={error?.message ?? "Could not load posts."}
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && (!posts || posts.length === 0) && (
          <EmptyState
            icon={<Megaphone size={28} />}
            title="No posts yet"
            description="Publish an announcement or email to get started."
          />
        )}

        {!isLoading && !isError && posts && posts.length > 0 && (
          <div className="two-column">
            {posts.map((post) => (
              <section className="panel" key={post.post_id}>
                <div className="panel-head">
                  <h2>{post.title}</h2>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Badge tone={post.post_type === "email" ? "gray" : "blue"}>
                      {post.post_type ?? "announcement"}
                    </Badge>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => openEdit(post)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(post.post_id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="panel-body">
                  <p style={{ fontSize: 12, marginBottom: 10, whiteSpace: "pre-wrap" }}>
                    {post.content}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--muted)" }}>
                    Posted {formatDate(post.created_at)}
                  </p>
                  <button
                    className="text-btn"
                    type="button"
                    onClick={() =>
                      setExpandedId(expandedId === post.post_id ? null : post.post_id)
                    }
                  >
                    <Paperclip size={14} />
                    {expandedId === post.post_id ? "Hide attachments" : "Attachments"}
                  </button>
                  {expandedId === post.post_id && (
                    <PostAttachmentsPanel postId={post.post_id} />
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

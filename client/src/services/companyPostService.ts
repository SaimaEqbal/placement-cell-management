import { axiosInstance } from "../api/axiosInstance";

/**
 * Axios calls for the company-post ("announcement") feature
 * (server/src/routes/companyPostRoutes.js -> companyPostController.js). Every
 * post is an announcement (the old 'email' type was removed). Attachments are
 * pasted Google Drive links (a name + a URL), NOT uploaded files, and they
 * travel with the post: create/update accept the full attachment set and every
 * read embeds `attachments[]`.
 */

/** Post category. The 'email' type was removed; announcements are the only kind. */
export type PostType = "announcement";

/**
 * Shape of a row from the `company_post_attachments` table. file_name is the
 * human-readable attachment name; file_url is the Google Drive URL.
 */
export interface PostAttachment {
  attachment_id: number;
  post_id: number;
  file_name: string;
  file_url: string;
  display_order?: number;
  /** Legacy columns, retained for back-compat; unused by the Drive-link flow. */
  mime_type?: string | null;
  uploaded_at?: string;
}

/** One attachment as submitted from a form (before it is saved). */
export interface PostAttachmentInput {
  file_name: string;
  file_url: string;
}

/** Shape of a `company_posts` row, with its ordered attachments embedded. */
export interface CompanyPostRecord {
  post_id: number;
  title: string;
  post_type: PostType | null;
  content: string;
  posted_by: string | null;
  created_at: string;
  updated_at: string;
  attachments: PostAttachment[];
  /** Phase 2: the drive this announcement belongs to, or null if standalone. */
  drive_id?: number | null;
}

/** Body accepted by POST /company-post (createCompanyPostSchema). */
export interface CreatePostPayload {
  title: string;
  content: string;
  /** Full attachment set for the post; omit or [] for none. */
  attachments?: PostAttachmentInput[];
  /** Phase 2: link this announcement to a drive (one announcement per drive). */
  drive_id?: number;
}

/**
 * Body accepted by PUT /company-post/:postId (updateCompanyPostSchema). Every
 * field optional; sending `attachments` replaces the whole set, omitting it
 * leaves them untouched.
 */
export type UpdatePostPayload = Partial<CreatePostPayload>;

/** Purpose: GET /company-post - list every post (any authenticated role). */
export function getPosts() {
  return axiosInstance
    .get<CompanyPostRecord[]>("/company-post")
    .then((res) => res.data);
}

/** Purpose: GET /company-post/:postId - fetch one post's detail. */
export function getPostById(postId: number | string) {
  return axiosInstance
    .get<CompanyPostRecord>(`/company-post/${postId}`)
    .then((res) => res.data);
}

/** Purpose: POST /company-post - create a post (Admin only). */
export function createPost(payload: CreatePostPayload) {
  return axiosInstance
    .post<CompanyPostRecord>("/company-post", payload)
    .then((res) => res.data);
}

/** Purpose: PUT /company-post/:postId - edit a post (Admin only). */
export function updatePost(postId: number | string, payload: UpdatePostPayload) {
  return axiosInstance
    .put<CompanyPostRecord>(`/company-post/${postId}`, payload)
    .then((res) => res.data);
}

/** Purpose: DELETE /company-post/:postId - remove a post and its attachments (Admin only). */
export function deletePost(postId: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/company-post/${postId}`)
    .then((res) => res.data);
}

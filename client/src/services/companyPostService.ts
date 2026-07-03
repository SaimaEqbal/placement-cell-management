import { axiosInstance } from "../api/axiosInstance";

/**
 * Axios calls for the company-post feature
 * (server/src/routes/companyPostRoutes.js -> companyPostController.js):
 * announcement/email posts and their (read-only, for now) attachments. Upload
 * is intentionally omitted - the backend route has no multipart handler yet, so
 * attachments can only be listed and deleted, not created, from the client.
 */

/** Post category (server/src/migrations/013_create_company_posts.sql CHECK). */
export type PostType = "announcement" | "email";

/** Shape of a row from the `company_posts` table. */
export interface CompanyPostRecord {
  post_id: number;
  title: string;
  post_type: PostType | null;
  content: string;
  posted_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Body accepted by POST /company-post (createCompanyPostSchema). */
export interface CreatePostPayload {
  title: string;
  content: string;
  post_type?: PostType;
}

/** Body accepted by PUT /company-post/:postId (updateCompanyPostSchema) - every field optional. */
export type UpdatePostPayload = Partial<CreatePostPayload>;

/** Shape of a row from the `company_post_attachments` table. */
export interface PostAttachment {
  attachment_id: number;
  post_id: number;
  file_name: string | null;
  mime_type: string | null;
  file_url: string;
  uploaded_at: string;
}

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

/** Purpose: DELETE /company-post/:postId - remove a post (Admin only). */
export function deletePost(postId: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/company-post/${postId}`)
    .then((res) => res.data);
}

/** Purpose: GET /company-post/:postId/attachments - list a post's attachments. */
export function getPostAttachments(postId: number | string) {
  return axiosInstance
    .get<PostAttachment[]>(`/company-post/${postId}/attachments`)
    .then((res) => res.data);
}

/** Purpose: DELETE /company-post/attachments/:attachmentId - remove an attachment (Admin only). */
export function deleteAttachment(attachmentId: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/company-post/attachments/${attachmentId}`)
    .then((res) => res.data);
}

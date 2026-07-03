import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  createPost,
  deleteAttachment,
  deletePost,
  getPostAttachments,
  getPostById,
  getPosts,
  updatePost,
  type CompanyPostRecord,
  type CreatePostPayload,
  type PostAttachment,
  type UpdatePostPayload,
} from "../services/companyPostService";
import { queryKeys } from "./queryKeys";

/** Purpose: TanStack Query wrappers over companyPostService.ts (posts CRUD + read/delete attachments). */

/** Purpose: GET /company-post - list all posts. Shared by the admin manager and the read-only announcements view. */
export function useCompanyPosts() {
  return useQuery<CompanyPostRecord[], ApiError>({
    queryKey: queryKeys.companyPosts,
    queryFn: getPosts,
  });
}

/** Purpose: GET /company-post/:postId - a single post's detail. */
export function useCompanyPost(id: number | string | undefined) {
  return useQuery<CompanyPostRecord, ApiError>({
    queryKey: queryKeys.companyPost(id ?? "unknown"),
    queryFn: () => getPostById(id as number | string),
    enabled: id !== undefined,
  });
}

/** Purpose: POST /company-post - create a post (Admin). Invalidates the posts list. */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<CompanyPostRecord, ApiError, CreatePostPayload>({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyPosts });
    },
  });
}

/** Purpose: PUT /company-post/:postId - edit a post (Admin). Invalidates the list and that post's detail. */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<
    CompanyPostRecord,
    ApiError,
    { id: number | string; payload: UpdatePostPayload }
  >({
    mutationFn: ({ id, payload }) => updatePost(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyPosts });
      queryClient.invalidateQueries({ queryKey: queryKeys.companyPost(variables.id) });
    },
  });
}

/** Purpose: DELETE /company-post/:postId - remove a post (Admin). Invalidates the posts list. */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyPosts });
    },
  });
}

/** Purpose: GET /company-post/:postId/attachments - a post's attachments. */
export function usePostAttachments(postId: number | string | undefined) {
  return useQuery<PostAttachment[], ApiError>({
    queryKey: queryKeys.postAttachments(postId ?? "unknown"),
    queryFn: () => getPostAttachments(postId as number | string),
    enabled: postId !== undefined,
  });
}

/** Purpose: DELETE /company-post/attachments/:attachmentId - remove an attachment (Admin). Refreshes that post's attachment list. */
export function useDeleteAttachment(postId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.postAttachments(postId) });
    },
  });
}

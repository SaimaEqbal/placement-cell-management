import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
  type CompanyPostRecord,
  type CreatePostPayload,
  type UpdatePostPayload,
} from "../services/companyPostService";
import { queryKeys } from "./queryKeys";

/** Purpose: TanStack Query wrappers over companyPostService.ts (announcement CRUD; attachments travel with each post). */

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

/**
 * An announcement can be drive-linked, so post mutations also refresh the drive
 * lists (their "Announcement" column) and any open drive detail.
 */
function invalidatePostsAndDrives(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.companyPosts });
  queryClient.invalidateQueries({ queryKey: queryKeys.drives });
  queryClient.invalidateQueries({ queryKey: queryKeys.myDrives });
}

/** Purpose: POST /company-post - create a post (Admin). Invalidates the posts list (+ drives if linked). */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<CompanyPostRecord, ApiError, CreatePostPayload>({
    mutationFn: createPost,
    onSuccess: () => invalidatePostsAndDrives(queryClient),
  });
}

/** Purpose: PUT /company-post/:postId - edit a post (Admin). Invalidates the list, that post's detail (+ drives). */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<
    CompanyPostRecord,
    ApiError,
    { id: number | string; payload: UpdatePostPayload }
  >({
    mutationFn: ({ id, payload }) => updatePost(id, payload),
    onSuccess: (_data, variables) => {
      invalidatePostsAndDrives(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.companyPost(variables.id) });
    },
  });
}

/** Purpose: DELETE /company-post/:postId - remove a post (Admin). Invalidates the posts list (+ drives). */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: deletePost,
    onSuccess: () => invalidatePostsAndDrives(queryClient),
  });
}


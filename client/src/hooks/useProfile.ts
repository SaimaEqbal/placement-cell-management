import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  createStudentProfile,
  getMyProfile,
  updateStudent,
  type CreateStudentPayload,
  type StudentRecord,
  type UpdateStudentPayload,
} from "../services/studentService";
import { queryKeys } from "./queryKeys";

/** Purpose: fetch + cache the signed-in student's own profile (GET /students/me). Every page that needs "my profile" (dashboard, view-profile, complete-profile) should call this hook instead of fetching directly, so they all share one cache entry - see the brief's "View Profile Page must reuse cached profile data, do not trigger duplicate requests" requirement. */
export function useProfile() {
  return useQuery<StudentRecord, ApiError>({
    queryKey: queryKeys.profile,
    queryFn: getMyProfile,
    // A 404 here means "profile not completed yet", not a transient failure -
    // retrying would just hit the same 404 again, so don't burn requests on it.
    retry: (failureCount, error) => {
      if (error.status !== null && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/** Purpose: POST /students - create the student's profile for the first time (Complete Profile step, first visit). Invalidates GET /students/me on success so the dashboard immediately reflects the new profile.*/
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation<StudentRecord, ApiError, CreateStudentPayload>({
    mutationFn: createStudentProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

/** Purpose: PUT /students/:id - update the student's own profile (Complete Profile step, subsequent edits). Invalidates + refetches GET /students/me on success, per the brief's "After successful update: invalidate profile query, automatically refetch profile".*/
export function useUpdateProfile(studentId: number | string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<StudentRecord, ApiError, UpdateStudentPayload>({
    mutationFn: (payload) => {
      if (studentId === undefined) {
        return Promise.reject<StudentRecord>({
          status: null,
          message: "Cannot update a profile before it has been created.",
        } satisfies ApiError);
      }
      return updateStudent(studentId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.students() });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import { applyForDrive, getStudentApplications, withdrawApplication, type ApplicationRecord, } from "../services/applicationService";
import { queryKeys } from "./queryKeys";

/**
 * Purpose: TanStack Query wrappers over the student-facing applicationService.
 *
 * REWRITE NOTE: the old hooks targeted a non-existent "/applications" resource
 * and 404'd. These match the real /application routes - apply, withdraw, and
 * list a student's applications. (The Admin/TPC review actions live in
 * useDrives.ts, since the backend mounts them under /drive.)
 */

/** Purpose: GET /application/student/:studentId - a student's own applications. */
export function useStudentApplications(studentId: number | string | undefined) {
  return useQuery<ApplicationRecord[], ApiError>({
    queryKey: queryKeys.studentApplications(studentId ?? "unknown"),
    queryFn: () => getStudentApplications(studentId as number | string),
    enabled: studentId !== undefined,
  });
}

/** Purpose: POST /application/apply/:driveId - apply a student to a drive. Invalidates that student's applications and the drive's applicant list so both the student view and the TPC/Admin review view stay fresh.*/
export function useApplyForDrive() {
  const queryClient = useQueryClient();

  return useMutation<ApplicationRecord,ApiError,{ driveId: number | string; studentId: number }>({
    mutationFn: ({ driveId, studentId }) => applyForDrive(driveId, studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentApplications(variables.studentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.driveApplicants(variables.driveId),
      });
    },
  });
}

/** Purpose: DELETE /application/:applicationId - withdraw an application (before the deadline). */
export function useWithdrawApplication(studentId: number | string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: withdrawApplication,
    onSuccess: () => {
      if (studentId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.studentApplications(studentId),
        });
      }
    },
  });
}
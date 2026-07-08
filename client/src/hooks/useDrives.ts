import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  confirmStudents,
  createDrive,
  deleteDrive,
  getDriveById,
  getDriveStudents,
  getDrives,
  markStudentRejected,
  markStudentSelected,
  removeDriveStudent,
  updateDrive,
  type CreateDrivePayload,
  type DriveRecord,
  type DriveStudent,
  type DriveWithEligible,
  type UpdateDrivePayload,
} from "../services/driveService";
import { queryKeys } from "./queryKeys";

/** Purpose: TanStack Query wrappers over driveService.ts - drive CRUD plus the admin shortlist pipeline (confirm eligible students, then select/reject/remove them). Mirrors useCompanies.ts: one shared cache per resource, and every mutation invalidates the keys it affects. */

/** Purpose: GET /drive - list all drives. Shared by student/Admin drive pages. */
export function useDrives() {
  return useQuery<DriveRecord[], ApiError>({
    queryKey: queryKeys.drives,
    queryFn: getDrives,
  });
}

/** Purpose: GET /drive/:driveId - a single drive's detail. */
export function useDrive(id: number | string | undefined) {
  return useQuery<DriveRecord, ApiError>({
    queryKey: queryKeys.drive(id ?? "unknown"),
    queryFn: () => getDriveById(id as number | string),
    enabled: id !== undefined,
  });
}

/** Purpose: POST /drive - create a drive. Returns { drive, eligibleStudents } for the admin to review; invalidates the drives list on success. */
export function useCreateDrive() {
  const queryClient = useQueryClient();

  return useMutation<DriveWithEligible, ApiError, CreateDrivePayload>({
    mutationFn: createDrive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drives });
    },
  });
}

/** Purpose: PUT /drive/:driveId - edit a drive. The backend clears the old shortlist and returns a fresh eligible list, so we invalidate the list, that drive's detail, and its (now empty) confirmed students. */
export function useUpdateDrive() {
  const queryClient = useQueryClient();

  return useMutation<
    DriveWithEligible,
    ApiError,
    { id: number | string; payload: UpdateDrivePayload }
  >({
    mutationFn: ({ id, payload }) => updateDrive(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drives });
      queryClient.invalidateQueries({ queryKey: queryKeys.drive(variables.id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.driveStudents(variables.id),
      });
    },
  });
}

/** Purpose: DELETE /drive/:driveId - remove a drive. Invalidates the drives list. */
export function useDeleteDrive() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: deleteDrive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drives });
    },
  });
}

/** Purpose: GET /drive/:driveId/students - the confirmed shortlist for a drive. */
export function useDriveStudents(driveId: number | string | undefined) {
  return useQuery<DriveStudent[], ApiError>({
    queryKey: queryKeys.driveStudents(driveId ?? "unknown"),
    queryFn: () => getDriveStudents(driveId as number | string),
    enabled: driveId !== undefined,
  });
}

/** Purpose: POST /drive/:driveId/confirm-students - persist the reviewed shortlist. Invalidates that drive's confirmed students so the roster refreshes. */
export function useConfirmStudents() {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    ApiError,
    { driveId: number | string; studentIds: Array<number | string> }
  >({
    mutationFn: ({ driveId, studentIds }) => confirmStudents(driveId, studentIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.driveStudents(variables.driveId),
      });
    },
  });
}

/** The three mutations below act on one confirmed student (drive_students row). They take the driveId only so onSuccess can refresh that drive's roster; the endpoints key off driveStudentId. */

/** Purpose: PATCH /drive/students/:driveStudentId/select. */
export function useMarkStudentSelected(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<DriveStudent, ApiError, number | string>({
    mutationFn: markStudentSelected,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.driveStudents(driveId),
      });
    },
  });
}

/** Purpose: PATCH /drive/students/:driveStudentId/reject. */
export function useMarkStudentRejected(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<DriveStudent, ApiError, number | string>({
    mutationFn: markStudentRejected,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.driveStudents(driveId),
      });
    },
  });
}

/** Purpose: DELETE /drive/students/:driveStudentId - remove a student from the shortlist. */
export function useRemoveDriveStudent(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: removeDriveStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.driveStudents(driveId),
      });
    },
  });
}

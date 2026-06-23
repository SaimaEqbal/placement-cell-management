import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  approveApplication,
  createDrive,
  deleteDrive,
  getDriveApplicants,
  getDriveById,
  getDriveResults,
  getDrives,
  markNotSelected,
  markSelected,
  rejectApplication,
  updateApplicationRound,
  updateDrive,
  type CreateDrivePayload,
  type DriveApplicant,
  type DriveRecord,
  type DriveResult,
  type UpdateDrivePayload,
} from "../services/driveService";
import { queryKeys } from "./queryKeys";

// Purpose: TanStack Query wrappers over driveService.ts - drive CRUD plus the Admin/TPC application-review pipeline. Mirrors useCompanies.ts: one shared cache per resource, and every mutation invalidates the keys it affects.

/** Purpose: GET /drive - list all drives. Shared by student/Admin/TPC drive pages. */
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

/** Purpose: POST /drive - create a drive. Invalidates the drives list on success. */
export function useCreateDrive() {
  const queryClient = useQueryClient();

  return useMutation<DriveRecord, ApiError, CreateDrivePayload>({
    mutationFn: createDrive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drives });
    },
  });
}

/** Purpose: PUT /drive/:driveId - edit a drive. Invalidates the list and that drive's detail. */
export function useUpdateDrive() {
  const queryClient = useQueryClient();

  return useMutation<
    DriveRecord,
    ApiError,
    { id: number | string; payload: UpdateDrivePayload }
  >({
    mutationFn: ({ id, payload }) => updateDrive(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drives });
      queryClient.invalidateQueries({ queryKey: queryKeys.drive(variables.id) });
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

/** Purpose: GET /drive/:driveId/applications - applicants for a drive. */
export function useDriveApplicants(driveId: number | string | undefined) {
  return useQuery<DriveApplicant[], ApiError>({
    queryKey: queryKeys.driveApplicants(driveId ?? "unknown"),
    queryFn: () => getDriveApplicants(driveId as number | string),
    enabled: driveId !== undefined,
  });
}

/** Purpose: GET /drive/:driveId/results - final results roster for a drive. */
export function useDriveResults(driveId: number | string | undefined) {
  return useQuery<DriveResult[], ApiError>({
    queryKey: queryKeys.driveResults(driveId ?? "unknown"),
    queryFn: () => getDriveResults(driveId as number | string),
    enabled: driveId !== undefined,
  });
}

/* The five mutations below all act on a single application within a drive. They take the driveId only so onSuccess can refresh that drive's applicant and results caches; it is not sent to the backend (the endpoints key off applicationId). */

/** Purpose: PUT /drive/applications/:applicationId/approve. */
export function useApproveApplication(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<DriveApplicant, ApiError, number | string>({
    mutationFn: approveApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driveApplicants(driveId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.driveResults(driveId) });
    },
  });
}

/** Purpose: PUT /drive/applications/:applicationId/reject. */
export function useRejectApplication(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<DriveApplicant, ApiError, number | string>({
    mutationFn: rejectApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driveApplicants(driveId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.driveResults(driveId) });
    },
  });
}

/** Purpose: PUT /drive/applications/:applicationId/round - advance an applicant to a round. */
export function useUpdateApplicationRound(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<
    DriveApplicant,
    ApiError,
    { applicationId: number | string; currentRound: number }
  >({
    mutationFn: ({ applicationId, currentRound }) =>
      updateApplicationRound(applicationId, currentRound),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driveApplicants(driveId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.driveResults(driveId) });
    },
  });
}

/** Purpose: PUT /drive/applications/:applicationId/select - mark an applicant finally selected. */
export function useMarkSelected(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<DriveApplicant, ApiError, number | string>({
    mutationFn: markSelected,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driveApplicants(driveId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.driveResults(driveId) });
    },
  });
}

/** Purpose: PUT /drive/applications/:applicationId/not-select - mark an applicant not selected. */
export function useMarkNotSelected(driveId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<DriveApplicant, ApiError, number | string>({
    mutationFn: markNotSelected,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driveApplicants(driveId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.driveResults(driveId) });
    },
  });
}
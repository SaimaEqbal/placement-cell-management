import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import {
  confirmStudents,
  createDrive,
  deleteDrive,
  getDriveById,
  getDriveEligible,
  getDriveStudents,
  getDrives,
  getMyDrives,
  getMyDriveResults,
  startRoundZero,
  finalizePrefilter,
  finalizeAttendance,
  advanceRound,
  completeDrive,
  markAttendance,
  getRoundHistory,
  getDriveRounds,
  setRoundDate,
  updateDrive,
  type CreateDrivePayload,
  type DriveRecord,
  type DriveRound,
  type DriveStudent,
  type DriveTransitionResult,
  type DriveWithEligible,
  type MyDrive,
  type MyDriveResult,
  type RoundDecision,
  type RoundHistoryRow,
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

/**
 * Purpose: GET /drive/:driveId/eligible - the freshly-generated eligible list for
 * an existing drive, for on-demand shortlist review. Only enabled when an id is
 * provided (e.g. the review dialog is open for that drive).
 */
export function useDriveEligible(id: number | string | undefined) {
  return useQuery<DriveWithEligible, ApiError>({
    queryKey: queryKeys.driveEligible(id ?? "unknown"),
    queryFn: () => getDriveEligible(id as number | string),
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

/** Purpose: GET /drive/my-drives - the drives the current student is shortlisted into. */
export function useMyDrives() {
  return useQuery<MyDrive[], ApiError>({
    queryKey: queryKeys.myDrives,
    queryFn: getMyDrives,
  });
}

/** Purpose: GET /drive/:driveId/my-results - the current student's own round-by-round progression. */
export function useMyDriveResults(driveId: number | string | undefined) {
  return useQuery<MyDriveResult[], ApiError>({
    queryKey: queryKeys.myDriveResults(driveId ?? "unknown"),
    queryFn: () => getMyDriveResults(driveId as number | string),
    enabled: driveId !== undefined,
  });
}

/**
 * The round-workflow mutations below all change a drive's state and/or its
 * students' rows, so each refreshes that drive's detail (drive_state/round_stage)
 * and its roster. A shared helper keeps the invalidation consistent.
 */
function useDriveWorkflowInvalidator(driveId: number | string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.drive(driveId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.driveStudents(driveId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.drives });
  };
}

/** Purpose: POST /drive/:driveId/start-round-0. */
export function useStartRoundZero(driveId: number | string) {
  const invalidate = useDriveWorkflowInvalidator(driveId);
  return useMutation<DriveTransitionResult, ApiError, void>({
    mutationFn: () => startRoundZero(driveId),
    onSuccess: invalidate,
  });
}

/** Purpose: POST /drive/:driveId/finalize-prefilter with the unchecked (removed) batch. */
export function useFinalizePrefilter(driveId: number | string) {
  const invalidate = useDriveWorkflowInvalidator(driveId);
  return useMutation<DriveTransitionResult, ApiError, RoundDecision[] | void>({
    mutationFn: (removed) => finalizePrefilter(driveId, removed ?? []),
    onSuccess: invalidate,
  });
}

/** Purpose: POST /drive/:driveId/finalize-attendance. */
export function useFinalizeAttendance(driveId: number | string) {
  const invalidate = useDriveWorkflowInvalidator(driveId);
  return useMutation<DriveTransitionResult, ApiError, void>({
    mutationFn: () => finalizeAttendance(driveId),
    onSuccess: invalidate,
  });
}

/** Purpose: POST /drive/:driveId/advance-round with the unchecked (rejected) batch. */
export function useAdvanceRound(driveId: number | string) {
  const invalidate = useDriveWorkflowInvalidator(driveId);
  return useMutation<DriveTransitionResult, ApiError, RoundDecision[] | void>({
    mutationFn: (rejected) => advanceRound(driveId, rejected ?? []),
    onSuccess: invalidate,
  });
}

/** Purpose: POST /drive/:driveId/complete with the unchecked (rejected) batch. */
export function useCompleteDrive(driveId: number | string) {
  const invalidate = useDriveWorkflowInvalidator(driveId);
  return useMutation<DriveTransitionResult, ApiError, RoundDecision[] | void>({
    mutationFn: (rejected) => completeDrive(driveId, rejected ?? []),
    onSuccess: invalidate,
  });
}

/** Purpose: PATCH .../attendance - mark one student present/absent. */
export function useMarkAttendance(driveId: number | string) {
  const invalidate = useDriveWorkflowInvalidator(driveId);
  return useMutation<
    { message: string },
    ApiError,
    { driveStudentId: number | string; present: boolean }
  >({
    mutationFn: ({ driveStudentId, present }) =>
      markAttendance(driveId, driveStudentId, present),
    onSuccess: invalidate,
  });
}

/** Purpose: GET /drive/:driveId/history?round=N - one round's full history (admin). */
export function useRoundHistory(
  driveId: number | string | undefined,
  round: number | undefined,
) {
  return useQuery<RoundHistoryRow[], ApiError>({
    queryKey: queryKeys.driveHistory(driveId ?? "unknown", round ?? "all"),
    queryFn: () => getRoundHistory(driveId as number | string, round),
    enabled: driveId !== undefined && round !== undefined,
  });
}

/** Purpose: GET /drive/:driveId/rounds - per-round dates for a drive. */
export function useDriveRounds(driveId: number | string | undefined) {
  return useQuery<DriveRound[], ApiError>({
    queryKey: queryKeys.driveRounds(driveId ?? "unknown"),
    queryFn: () => getDriveRounds(driveId as number | string),
    enabled: driveId !== undefined,
  });
}

/** Purpose: PATCH /drive/:driveId/rounds/:roundNo/date - set a round's date (notifies its students). */
export function useSetRoundDate(driveId: number | string) {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    ApiError,
    { roundNo: number; round_date: string; round_name?: string }
  >({
    mutationFn: ({ roundNo, round_date, round_name }) =>
      setRoundDate(driveId, roundNo, round_date, round_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driveRounds(driveId) });
      // The drives lists show the current round's date/name, so refresh them too.
      queryClient.invalidateQueries({ queryKey: queryKeys.drives });
      queryClient.invalidateQueries({ queryKey: queryKeys.myDrives });
    },
  });
}

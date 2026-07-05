import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import type { ApiError } from "../api/apiError";
import { deleteStudent, type StudentRecord } from "../services/studentService";
import {
  getSpcQueue,
  spcRejectStudent,
  spcVerifyStudent,
} from "../services/spcService";
import {
  assignStudentsToSpc,
  demoteFromSpc,
  getTpcBranches,
  getTpcQueue,
  getTpcSpcs,
  getTpcSpcVerified,
  getTpcStudents,
  promoteToSpc,
  tpcRejectStudent,
  tpcVerifyStudent,
  type TpcSpcRow,
} from "../services/tpcService";
import { queryKeys } from "./queryKeys";

/**
 * Purpose: TanStack Query hooks for the SPC/TPC verification pipeline - the
 * queues, the branch/SPC lookups the TPC assignment screen needs, and the
 * verify/reject/assign/promote/demote mutations. Kept separate from
 * useStudents.ts (plain student CRUD) since these map onto the /spc and /tpc
 * route namespaces.
 */

// ---- SPC ------------------------------------------------------------------

/** GET /spc/verification-queue - this SPC's assigned + pending students. */
export function useSpcQueue() {
  return useQuery<StudentRecord[], ApiError>({
    queryKey: queryKeys.spcQueue,
    queryFn: getSpcQueue,
  });
}

export function useSpcVerify() {
  const qc = useQueryClient();
  return useMutation<StudentRecord, ApiError, number | string>({
    mutationFn: (id) => spcVerifyStudent(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.spcQueue });
      qc.invalidateQueries({ queryKey: queryKeys.student(id) });
    },
  });
}

export function useSpcReject() {
  const qc = useQueryClient();
  return useMutation<
    StudentRecord,
    ApiError,
    { id: number | string; reason: string }
  >({
    mutationFn: ({ id, reason }) => spcRejectStudent(id, reason),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.spcQueue });
      qc.invalidateQueries({ queryKey: queryKeys.student(id) });
    },
  });
}

// ---- TPC ------------------------------------------------------------------

/** Invalidate everything the TPC pipeline reads after a mutation. */
function invalidateTpc(qc: QueryClient, id?: number | string) {
  qc.invalidateQueries({ queryKey: ["tpc"] });
  qc.invalidateQueries({ queryKey: queryKeys.students() });
  if (id !== undefined) qc.invalidateQueries({ queryKey: queryKeys.student(id) });
}

export function useTpcStudents(rollNo?: string) {
  return useQuery<StudentRecord[], ApiError>({
    queryKey: queryKeys.tpcStudents(rollNo),
    queryFn: () => getTpcStudents(rollNo),
  });
}

export function useTpcQueue(branch?: string) {
  return useQuery<StudentRecord[], ApiError>({
    queryKey: queryKeys.tpcQueue(branch),
    queryFn: () => getTpcQueue(branch),
  });
}

export function useTpcSpcVerified(branch?: string) {
  return useQuery<StudentRecord[], ApiError>({
    queryKey: queryKeys.tpcSpcVerified(branch),
    queryFn: () => getTpcSpcVerified(branch),
  });
}

export function useTpcBranches() {
  return useQuery<string[], ApiError>({
    queryKey: queryKeys.tpcBranches,
    queryFn: getTpcBranches,
  });
}

export function useTpcSpcs(branch: string | undefined) {
  return useQuery<TpcSpcRow[], ApiError>({
    queryKey: queryKeys.tpcSpcs(branch ?? ""),
    queryFn: () => getTpcSpcs(branch as string),
    enabled: !!branch,
  });
}

export function useTpcVerify() {
  const qc = useQueryClient();
  return useMutation<StudentRecord, ApiError, number | string>({
    mutationFn: (id) => tpcVerifyStudent(id),
    onSuccess: (_data, id) => invalidateTpc(qc, id),
  });
}

export function useTpcReject() {
  const qc = useQueryClient();
  return useMutation<
    StudentRecord,
    ApiError,
    { id: number | string; reason: string }
  >({
    mutationFn: ({ id, reason }) => tpcRejectStudent(id, reason),
    onSuccess: (_data, { id }) => invalidateTpc(qc, id),
  });
}

export function useAssignSpc() {
  const qc = useQueryClient();
  return useMutation<
    { message: string; totalAssigned: number; perSpc: Record<string, number> },
    ApiError,
    string
  >({
    mutationFn: (branch) => assignStudentsToSpc(branch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tpc"] }),
  });
}

export function usePromoteSpc() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: (studentId) => promoteToSpc(studentId),
    onSuccess: (_data, id) => invalidateTpc(qc, id),
  });
}

export function useDemoteSpc() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: (studentId) => demoteFromSpc(studentId),
    onSuccess: (_data, id) => invalidateTpc(qc, id),
  });
}

/** DELETE /students/:id from the TPC roster (also refreshes the tpc lists). */
export function useTpcDeleteStudent() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, ApiError, number | string>({
    mutationFn: (id) => deleteStudent(id),
    onSuccess: () => invalidateTpc(qc),
  });
}

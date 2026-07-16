import { axiosInstance } from "../api/axiosInstance";
import type { StudentRecord } from "./studentService";

/**
 * Purpose: Axios calls under the backend's /tpc namespace
 * (server/src/routes/tpcRoutes.js) - managing TPC accounts, promoting/demoting
 * SPCs, and the whole TPC verification pipeline (queue, SPC-verified list,
 * department roster, SPC assignment, final verify/reject).
 */

/** Shape of a row from the `tpc` table (server/src/migrations/008 + 016). */
export interface TpcRecord {
  tpc_id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  /** The department this TPC oversees (was `branch` before migration 016). */
  department: string;
  /** Optional finer-grained branch; a TPC usually oversees a whole department. */
  branch: string | null;
  created_at: string;
}

/** A row from GET /tpc/spcs - an SPC coordinator with details from their student row. */
export interface TpcSpcRow {
  spc_id: number;
  name: string;
  email: string;
  department: string;
  branch: string | null;
  roll_no: string | null;
  semester: number | null;
  batch: number | null;
}

/** Body accepted by POST /tpc (createTPCSchema). */
export interface CreateTpcPayload {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  branch?: string;
}

/** Body accepted by PUT /tpc/:tpcId (updateTPCSchema) - every field optional. */
export type UpdateTpcPayload = Partial<Omit<CreateTpcPayload, "user_id">>;

/** Purpose: GET /tpc - list TPC accounts (Admin only). */
export function getAllTpcs() {
  return axiosInstance.get<TpcRecord[]>("/tpc").then((res) => res.data);
}

/** Purpose: POST /tpc - register a new TPC account (Admin only). */
export function createTpc(payload: CreateTpcPayload) {
  return axiosInstance.post<TpcRecord>("/tpc", payload).then((res) => res.data);
}

/** Purpose: PUT /tpc/:tpcId - edit a TPC account's details (Admin or the TPC themselves). */
export function updateTpc(tpcId: number | string, payload: UpdateTpcPayload) {
  return axiosInstance
    .put<{ message: string; tpc: TpcRecord }>(`/tpc/${tpcId}`, payload)
    .then((res) => res.data);
}

/** Purpose: DELETE /tpc/:tpcId - remove a TPC account (Admin only). */
export function deleteTpc(tpcId: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/tpc/${tpcId}`)
    .then((res) => res.data);
}

/** Purpose: PUT /tpc/promote-spc/:studentId - promote a student to the SPC role (TPC only). */
export function promoteToSpc(studentId: number | string) {
  return axiosInstance
    .put<{ message: string }>(`/tpc/promote-spc/${studentId}`)
    .then((res) => res.data);
}

/** Purpose: PUT /tpc/demote-spc/:studentId - demote an SPC back to a plain student (TPC only). */
export function demoteFromSpc(studentId: number | string) {
  return axiosInstance
    .put<{ message: string }>(`/tpc/demote-spc/${studentId}`)
    .then((res) => res.data);
}

// ---- Verification pipeline ------------------------------------------------

/** Build a query-param object from optional filters, omitting blank ones. */
function filterParams(filters: Record<string, string | number | undefined>) {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params[key] = value;
  }
  return params;
}

/** Purpose: GET /tpc/students?rollNo=&year= - all students in the TPC's department. */
export function getTpcStudents(rollNo?: string, year?: string) {
  return axiosInstance
    .get<StudentRecord[]>("/tpc/students", { params: filterParams({ rollNo, year }) })
    .then((res) => res.data);
}

/** Purpose: GET /tpc/verification-queue?branch=&year= - students the SPC rejected. */
export function getTpcQueue(branch?: string, year?: string) {
  return axiosInstance
    .get<StudentRecord[]>("/tpc/verification-queue", {
      params: filterParams({ branch, year }),
    })
    .then((res) => res.data);
}

/** Purpose: GET /tpc/spc-verified?branch=&year= - SPC-verified students + SPC coordinators awaiting the TPC. */
export function getTpcSpcVerified(branch?: string, year?: string) {
  return axiosInstance
    .get<StudentRecord[]>("/tpc/spc-verified", {
      params: filterParams({ branch, year }),
    })
    .then((res) => res.data);
}

/** Purpose: GET /tpc/branches - distinct branches under the TPC's department. */
export function getTpcBranches() {
  return axiosInstance.get<string[]>("/tpc/branches").then((res) => res.data);
}

/** Purpose: GET /tpc/spcs?branch=&year= - the SPCs in a given branch, ordered by spc_id. */
export function getTpcSpcs(branch: string, year?: string) {
  return axiosInstance
    .get<TpcSpcRow[]>("/tpc/spcs", { params: filterParams({ branch, year }) })
    .then((res) => res.data);
}

/** Purpose: POST /tpc/assign-spc - divide the branch's students among its SPCs. */
export function assignStudentsToSpc(branch: string) {
  return axiosInstance
    .post<{ message: string; totalAssigned: number; perSpc: Record<string, number> }>(
      "/tpc/assign-spc",
      { branch },
    )
    .then((res) => res.data);
}

/** Purpose: PUT /tpc/verify/:studentId - TPC final approval. */
export function tpcVerifyStudent(id: number | string) {
  return axiosInstance
    .put<StudentRecord>(`/tpc/verify/${id}`)
    .then((res) => res.data);
}

/** Purpose: PUT /tpc/reject/:studentId - TPC final rejection with a reason. */
export function tpcRejectStudent(id: number | string, reason: string) {
  return axiosInstance
    .put<StudentRecord>(`/tpc/reject/${id}`, { reason })
    .then((res) => res.data);
}

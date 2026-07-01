import { axiosInstance } from "../api/axiosInstance";

/**
 * Purpose: Axios calls under the backend's /tpc namespace
 * (server/src/routes/tpcRoutes.js) - managing TPC accounts, and promoting/
 * demoting a student to/from the SPC role.
 *
 * Not in the brief's literal service-file list, but added alongside
 * studentService.ts/spcService.ts because the TPC requirements (final
 * verification, managing the verification pipeline) map onto this distinct
 * backend route namespace, not onto plain student CRUD.
 */

/** Shape of a row from the `tpc` table (server/src/migrations/008_create_tpc.sql). */
export interface TpcRecord {
  tpc_id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  created_at: string;
}

/** Body accepted by POST /tpc (createTPCSchema). */
export interface CreateTpcPayload {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
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

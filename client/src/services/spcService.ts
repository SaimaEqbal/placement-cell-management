import { axiosInstance } from "../api/axiosInstance";
import type { StudentRecord, UpdateStudentPayload } from "./studentService";

// Purpose: Axios calls under the backend's /spc namespace
// (server/src/routes/spcRoutes.js). Only one route exists there today - the
// SPC-gated student update used for the SPC verification step - so this
// file is small by design, not an oversight.
//
// Not in the brief's literal service-file list, but added alongside
// studentService.ts/tpcService.ts because the backend genuinely exposes a
// distinct, role-gated /spc route namespace that student CRUD calls cannot
// reach.

/**
 * Purpose: PUT /spc/:id - SPC-only update of a student record (e.g.
 * recording SPC-level verification). Requires an authenticated SPC JWT
 * (requireSPC middleware). Functionally identical to updateStudent() in
 * studentService.ts, just gated behind the SPC role instead of being open.
 */
export function spcUpdateStudent(
  id: number | string,
  payload: UpdateStudentPayload,
) {
  return axiosInstance
    .put<StudentRecord>(`/spc/${id}`, payload)
    .then((res) => res.data);
}

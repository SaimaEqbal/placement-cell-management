import { axiosInstance } from "../api/axiosInstance";
import type { StudentRecord } from "./studentService";

/**
 * Purpose: Axios calls under the backend's /spc namespace
 * (server/src/routes/spcRoutes.js). An SPC is otherwise a normal student; their
 * only extra duty is verifying the students the TPC assigned to them.
 *
 * - getSpcQueue:  students assigned to this SPC that are still pending review.
 * - spcVerify:    approve at SPC level (-> review_status 'spc_verified').
 * - spcReject:    reject with a reason (-> 'spc_rejected', routed to the TPC).
 */

/** Purpose: GET /spc/verification-queue - this SPC's assigned + pending students. */
export function getSpcQueue() {
  return axiosInstance
    .get<StudentRecord[]>("/spc/verification-queue")
    .then((res) => res.data);
}

/** Purpose: PUT /spc/verify/:studentId - SPC-level approval. */
export function spcVerifyStudent(id: number | string) {
  return axiosInstance
    .put<StudentRecord>(`/spc/verify/${id}`)
    .then((res) => res.data);
}

/** Purpose: PUT /spc/reject/:studentId - SPC-level rejection with a reason. */
export function spcRejectStudent(id: number | string, reason: string) {
  return axiosInstance
    .put<StudentRecord>(`/spc/reject/${id}`, { reason })
    .then((res) => res.data);
}

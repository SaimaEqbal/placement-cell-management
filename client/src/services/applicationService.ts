import { axiosInstance } from "../api/axiosInstance";

/* Purpose: Axios calls for the placement-application workflow (server/src/controllers/applicationController.js). STATUS: TODO / not wired up on the backend yet. The controller and router (server/src/routes/applicationRoutes.js) both exist, but server/src/routes/index.js never mounts them under the shared /api router . Every call below currently 404s against the real backend. */

export interface ApplicationRecord {
  id: number;
  student_id: number;
  company_id: number;
  status: string;
  applied_at: string;
  student_name: string;
  company_name: string;
}

/** Purpose: GET /applications - list every application (Admin/TPC view). */
export function getApplications() {
  return axiosInstance
    .get<ApplicationRecord[]>("/applications")
    .then((res) => res.data);
}

/** Purpose: GET /applications/:id - fetch one application's detail. */
export function getApplicationById(id: number | string) {
  return axiosInstance
    .get<ApplicationRecord>(`/applications/${id}`)
    .then((res) => res.data);
}

/** Purpose: POST /applications - shortlist a student for a company/drive. */
export function createApplication(studentId: number, companyId: number) {
  return axiosInstance
    .post<ApplicationRecord>("/applications", {
      student_id: studentId,
      company_id: companyId,
    })
    .then((res) => res.data);
}

/** Purpose: PUT /applications/:id/status - move an application through its workflow (e.g. Applied -> Shortlisted -> Selected/Rejected). */
export function updateApplicationStatus(id: number | string, status: string) {
  return axiosInstance
    .put<ApplicationRecord>(`/applications/${id}/status`, { status })
    .then((res) => res.data);
}

/** Purpose: DELETE /applications/:id - withdraw/remove an application. */
export function deleteApplication(id: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/applications/${id}`)
    .then((res) => res.data);
}

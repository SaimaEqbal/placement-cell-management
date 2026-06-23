import { axiosInstance } from "../api/axiosInstance";

// Purpose: every Axios call for the `drives` resource and its application-
// management sub-routes. The backend mounts all of these under /drive
// (server/src/routes/driveRoutes.js -> driveController.js), including the
// approve/reject/round/select endpoints that operate on a drive's
// applications - so they live here rather than in applicationService.ts.

/** Employment types accepted by createDriveSchema (server/src/lib/schema.js). */
export type EmploymentType = "FTE" | "Internship" | "Internship + PPO";

/** Lifecycle status of a drive (server/src/migrations/010_create_drives.sql). */
export type DriveStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

/** Shape of a row from the `drives` table (server/src/migrations/010_create_drives.sql). */
export interface DriveRecord {
  drive_id: number;
  company_id: number;
  job_role: string | null;
  job_description: string | null;
  package_ctc: string | number | null;
  employment_type: EmploymentType;
  drive_date: string;
  application_deadline: string;
  minimum_cgpa: string | number;
  allowed_branches: string[];
  max_active_backlogs: number;
  max_passive_backlogs: number;
  number_of_rounds: number;
  status: DriveStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Body accepted by POST /drive (createDriveSchema). Numbers must be sent as
 * real numbers (the backend uses z.number()), and optional fields should be
 * omitted entirely when blank rather than sent as NaN/"".
 */
export interface CreateDrivePayload {
  company_id: number;
  job_role?: string;
  job_description?: string;
  package_ctc?: number;
  employment_type: EmploymentType;
  drive_date: string; // "YYYY-MM-DD"
  application_deadline: string; // "YYYY-MM-DD"
  minimum_cgpa: number;
  allowed_branches: string[];
  max_active_backlogs?: number;
  max_passive_backlogs?: number;
  number_of_rounds?: number;
}

/** Body accepted by PUT /drive/:driveId (updateDriveSchema) - every field optional, plus status. */
export type UpdateDrivePayload = Partial<CreateDrivePayload> & {
  status?: DriveStatus;
};

/** Shape of a row from GET /drive/:driveId/applications (applications joined to students). */
export interface DriveApplicant {
  application_id: number;
  student_id: number;
  drive_id: number;
  current_round: number;
  status: string;
  applied_at: string;
  name: string;
  email: string;
  roll_no: string;
  branch: string | null;
  cgpa: string | number | null;
}

/** Shape of a row from GET /drive/:driveId/results. */
export interface DriveResult {
  name: string;
  roll_no: string;
  branch: string | null;
  current_round: number;
  status: string;
}

/** Purpose: GET /drive - list every drive (any authenticated role). */
export function getDrives() {
  return axiosInstance.get<DriveRecord[]>("/drive").then((res) => res.data);
}

/** Purpose: GET /drive/:driveId - fetch one drive's full detail. */
export function getDriveById(id: number | string) {
  return axiosInstance.get<DriveRecord>(`/drive/${id}`).then((res) => res.data);
}

/** Purpose: POST /drive - create a drive (Admin/TPC/SPC, per requireAdminTPCSPC). */
export function createDrive(payload: CreateDrivePayload) {
  return axiosInstance
    .post<DriveRecord>("/drive", payload)
    .then((res) => res.data);
}

/** Purpose: PUT /drive/:driveId - edit a drive (Admin/TPC/SPC). */
export function updateDrive(id: number | string, payload: UpdateDrivePayload) {
  return axiosInstance
    .put<DriveRecord>(`/drive/${id}`, payload)
    .then((res) => res.data);
}

/** Purpose: DELETE /drive/:driveId - remove a drive (Admin/TPC only). */
export function deleteDrive(id: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/drive/${id}`)
    .then((res) => res.data);
}

/** Purpose: GET /drive/:driveId/applications - applicants for a drive (Admin/TPC/SPC). */
export function getDriveApplicants(driveId: number | string) {
  return axiosInstance
    .get<DriveApplicant[]>(`/drive/${driveId}/applications`)
    .then((res) => res.data);
}

/** Purpose: GET /drive/:driveId/results - final results roster for a drive (Admin/TPC/SPC). */
export function getDriveResults(driveId: number | string) {
  return axiosInstance
    .get<DriveResult[]>(`/drive/${driveId}/results`)
    .then((res) => res.data);
}

/** Purpose: PUT /drive/applications/:applicationId/approve - approve an application (Admin/TPC). */
export function approveApplication(applicationId: number | string) {
  return axiosInstance
    .put<DriveApplicant>(`/drive/applications/${applicationId}/approve`)
    .then((res) => res.data);
}

/** Purpose: PUT /drive/applications/:applicationId/reject - reject an application (Admin/TPC). */
export function rejectApplication(applicationId: number | string) {
  return axiosInstance
    .put<DriveApplicant>(`/drive/applications/${applicationId}/reject`)
    .then((res) => res.data);
}

/** Purpose: PUT /drive/applications/:applicationId/round - move an applicant to a round (Admin/TPC/SPC). */
export function updateApplicationRound(
  applicationId: number | string,
  current_round: number,
) {
  return axiosInstance
    .put<DriveApplicant>(`/drive/applications/${applicationId}/round`, {
      current_round,
    })
    .then((res) => res.data);
}

/** Purpose: PUT /drive/applications/:applicationId/select - mark an applicant finally selected (Admin/TPC). */
export function markSelected(applicationId: number | string) {
  return axiosInstance
    .put<DriveApplicant>(`/drive/applications/${applicationId}/select`)
    .then((res) => res.data);
}

/** Purpose: PUT /drive/applications/:applicationId/not-select - mark an applicant not selected (Admin/TPC). */
export function markNotSelected(applicationId: number | string) {
  return axiosInstance
    .put<DriveApplicant>(`/drive/applications/${applicationId}/not-select`)
    .then((res) => res.data);
}

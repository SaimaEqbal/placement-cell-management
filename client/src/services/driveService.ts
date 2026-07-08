import { axiosInstance } from "../api/axiosInstance";

/**
 * Purpose: every Axios call for the `drives` resource and its shortlist
 * (`drive_students`) sub-routes. The backend mounts all of these under /drive
 * (server/src/routes/driveRoutes.js -> driveController.js).
 *
 * WORKFLOW NOTE: students no longer apply to drives. An admin creates a drive,
 * the backend returns an automatically generated list of *eligible* students
 * (never stored), the admin reviews it and confirms a subset, and only those
 * confirmed students are written to `drive_students`. The old applications
 * pipeline (apply / approve / reject / per-application rounds) is gone.
 */

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

/**
 * A student returned by getEligibleStudentsForDrive() - i.e. a student who
 * satisfies the drive's eligibility criteria. This list is generated on the
 * fly and never persisted; it only exists in the create/update drive response.
 * `id` is students.id (a bigint node-pg serialises as a string).
 */
export interface EligibleStudent {
  id: string | number;
  roll_no: string;
  name: string;
  email: string;
  phone: string | null;
  branch: string | null;
  department: string | null;
  cgpa: string | number | null;
  active_backlogs: number;
  passive_backlogs: number;
}

/** Workflow status of a confirmed student inside a drive (`drive_students.status`). */
export type DriveStudentStatus = "shortlisted" | "selected" | "not_selected";

/** Shape of a row from GET /drive/:driveId/students (`drive_students` joined to students). */
export interface DriveStudent {
  drive_student_id: number;
  current_round: number;
  status: DriveStudentStatus;
  remarks: string | null;
  id: string | number;
  roll_no: string;
  name: string;
  email: string;
  branch: string | null;
  cgpa: string | number | null;
}

/** Response body from POST /drive and PUT /drive/:driveId - the saved drive plus the freshly generated eligible list to review. */
export interface DriveWithEligible {
  message?: string;
  drive: DriveRecord;
  eligibleStudents: EligibleStudent[];
}

/** Purpose: GET /drive - list every drive (any authenticated role). */
export function getDrives() {
  return axiosInstance.get<DriveRecord[]>("/drive").then((res) => res.data);
}

/** Purpose: GET /drive/:driveId - fetch one drive's full detail. */
export function getDriveById(id: number | string) {
  return axiosInstance.get<DriveRecord>(`/drive/${id}`).then((res) => res.data);
}

/**
 * Purpose: POST /drive - create a drive (Admin only). Returns the saved drive
 * plus the eligible students to review; no students are stored until confirmed.
 */
export function createDrive(payload: CreateDrivePayload) {
  return axiosInstance
    .post<DriveWithEligible>("/drive", payload)
    .then((res) => res.data);
}

/**
 * Purpose: PUT /drive/:driveId - edit a drive (Admin only). The backend clears
 * the existing shortlist and returns a fresh eligible list, so the admin must
 * review and confirm again after any change to the eligibility criteria.
 */
export function updateDrive(id: number | string, payload: UpdateDrivePayload) {
  return axiosInstance
    .put<DriveWithEligible>(`/drive/${id}`, payload)
    .then((res) => res.data);
}

/** Purpose: DELETE /drive/:driveId - remove a drive (Admin only). */
export function deleteDrive(id: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/drive/${id}`)
    .then((res) => res.data);
}

/** Purpose: GET /drive/:driveId/students - the confirmed shortlist for a drive. */
export function getDriveStudents(driveId: number | string) {
  return axiosInstance
    .get<DriveStudent[]>(`/drive/${driveId}/students`)
    .then((res) => res.data);
}

/**
 * Purpose: POST /drive/:driveId/confirm-students - persist the admin's chosen
 * subset of the eligible list into `drive_students`. studentIds must be real
 * numbers (students.id arrives as a string, so coerce before sending).
 */
export function confirmStudents(
  driveId: number | string,
  studentIds: Array<number | string>,
) {
  return axiosInstance
    .post<{ message: string }>(`/drive/${driveId}/confirm-students`, {
      studentIds: studentIds.map((id) => Number(id)),
    })
    .then((res) => res.data);
}

/** Purpose: PATCH /drive/students/:driveStudentId/select - mark a confirmed student finally selected. */
export function markStudentSelected(driveStudentId: number | string) {
  return axiosInstance
    .patch<DriveStudent>(`/drive/students/${driveStudentId}/select`)
    .then((res) => res.data);
}

/** Purpose: PATCH /drive/students/:driveStudentId/reject - mark a confirmed student not selected. */
export function markStudentRejected(driveStudentId: number | string) {
  return axiosInstance
    .patch<DriveStudent>(`/drive/students/${driveStudentId}/reject`)
    .then((res) => res.data);
}

/** Purpose: DELETE /drive/students/:driveStudentId - remove a student from the shortlist. */
export function removeDriveStudent(driveStudentId: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/drive/students/${driveStudentId}`)
    .then((res) => res.data);
}

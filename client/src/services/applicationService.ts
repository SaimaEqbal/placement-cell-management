import { axiosInstance } from "../api/axiosInstance";

/*
 * Purpose: the student-facing side of the placement-application workflow
 * (server/src/routes/applicationRoutes.js -> applicationController.js):
 * applying to a drive, withdrawing, and listing a student's applications.
 *
 * REWRITE NOTE: this file previously pointed at a guessed "/applications"
 * resource that the backend never exposed (every call 404'd) and modelled
 * applications as attaching to a company_id. The real backend mounts these
 * routes under /application and attaches every application to a drive_id, so
 * the functions below match that contract. The TPC/Admin review actions
 * (approve/reject/round/select) live in driveService.ts because the backend
 * mounts them under /drive.
 */

/** Shape of a row from the `applications` table (server/src/migrations/003_create_applications.sql). */
export interface ApplicationRecord {
  application_id: number;
  student_id: number;
  drive_id: number;
  current_round: number;
  status: string;
  applied_at: string;
}

/**
 * Purpose: POST /application/apply/:driveId - apply a student to a drive.
 * Used both by a student applying for themselves and by Admin/TPC
 * shortlisting a student into a drive (the backend has a single apply route).
 */
export function applyForDrive(
  driveId: number | string,
  studentId: number,
) {
  return axiosInstance
    .post<ApplicationRecord>(`/application/apply/${driveId}`, {
      student_id: studentId,
    })
    .then((res) => res.data);
}

/**
 * Purpose: DELETE /application/:applicationId - withdraw an application.
 * The backend only allows this before the drive's application_deadline.
 */
export function withdrawApplication(applicationId: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/application/${applicationId}`)
    .then((res) => res.data);
}

/** Purpose: GET /application/student/:studentId - list a student's applications. */
export function getStudentApplications(studentId: number | string) {
  return axiosInstance
    .get<ApplicationRecord[]>(`/application/student/${studentId}`)
    .then((res) => res.data);
}

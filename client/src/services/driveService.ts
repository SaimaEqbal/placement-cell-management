import { axiosInstance } from "../api/axiosInstance";
import type { CompanyPostRecord, PostAttachmentInput } from "./companyPostService";

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

/** Authoritative round-workflow state of a drive (server/src/migrations/024). */
export type DriveState = "SHORTLISTING" | "ROUND_IN_PROGRESS" | "COMPLETED";

/** Sub-stage within an in-progress round (rounds >= 1); null while shortlisting. */
export type RoundStage = "PREFILTER" | "ATTENDANCE" | "RESULT";

/** Shape of a row from the `drives` table (server/src/migrations/010_create_drives.sql). */
export interface DriveRecord {
  drive_id: number;
  company_id: number;
  job_role: string | null;
  job_description: string | null;
  package_ctc: string | number | null;
  employment_type: EmploymentType;
  minimum_cgpa: string | number;
  /** Optional: minimum SPI required in every recorded semester; null = no constraint. */
  minimum_cgpa_throughout: string | number | null;
  allowed_branches: string[];
  /** Target student batches (graduation years); null on legacy drives = unrestricted. */
  allowed_batches: number[] | null;
  max_active_backlogs: number;
  max_passive_backlogs: number;
  number_of_rounds: number;
  status: DriveStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  current_round: number;
  drive_state: DriveState;
  round_stage: RoundStage | null;
  is_locked: boolean;
  /** Phase 2: the linked announcement's post_id, or null if the drive has none. */
  announcement_id?: number | null;
}

/**
 * The announcement fields optionally created alongside a drive (Phase 2). The
 * drive link is set server-side, so this carries only the announcement body +
 * attachments — the same shape the standalone announcement form produces.
 */
export interface DriveAnnouncementInput {
  title: string;
  content: string;
  attachments?: PostAttachmentInput[];
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
  minimum_cgpa: number;
  /** Optional: minimum SPI required in every recorded semester. Omit for none. */
  minimum_cgpa_throughout?: number;
  allowed_branches: string[];
  /** Target student batches (graduation years); at least one required. */
  allowed_batches: number[];
  max_active_backlogs?: number;
  max_passive_backlogs?: number;
  number_of_rounds?: number;
  /** Optional: create an announcement for this drive atomically in the same request. */
  announcement?: DriveAnnouncementInput;
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

/**
 * Current state of a confirmed student inside a drive (`drive_students.status`,
 * server/src/migrations/025_drive_students_status.sql - uppercase vocabulary).
 */
export type DriveStudentStatus =
  | "SHORTLISTED"
  | "ACTIVE"
  | "SELECTED"
  | "REJECTED"
  | "ABSENT"
  | "REMOVED"
  | "PLACED";

/** Transient per-round attendance mark. */
export type AttendanceMark = "PRESENT" | "ABSENT" | null;

/** Shape of a row from GET /drive/:driveId/students (`drive_students` joined to students). */
export interface DriveStudent {
  drive_student_id: number;
  current_round: number;
  status: DriveStudentStatus;
  attendance_mark: AttendanceMark;
  remarks: string | null;
  id: string | number;
  roll_no: string;
  name: string;
  email: string;
  branch: string | null;
  cgpa: string | number | null;
}

/**
 * A drive the current student has been shortlisted into, carrying the student's
 * OWN status/round (GET /drive/my-drives). Never exposes other students.
 */
export interface MyDrive extends DriveRecord {
  my_status: DriveStudentStatus;
  my_current_round: number;
}

/** History stage/result of one of the student's own round events. */
export type HistoryStage = "SHORTLIST" | "PREFILTER" | "ATTENDANCE" | "RESULT";
export type HistoryResult =
  | "SHORTLISTED"
  | "REMOVED"
  | "PRESENT"
  | "ABSENT"
  | "SELECTED"
  | "REJECTED"
  | "PLACED";

/** One row of the current student's own progression in a drive (GET /drive/:id/my-results). */
export interface MyDriveResult {
  history_id: number;
  round_no: number;
  stage: HistoryStage;
  result: HistoryResult;
  reason: string | null;
  recorded_at: string;
}

/** One row of a drive's per-round history for admins (GET /drive/:id/history), joined to the student. */
export interface RoundHistoryRow {
  history_id: number;
  student_id: string | number;
  round_no: number;
  stage: HistoryStage;
  result: HistoryResult;
  reason: string | null;
  recorded_at: string;
  name: string;
  roll_no: string;
  branch: string | null;
}

/** Response of a round-workflow transition: the saved message plus the updated drive. */
export interface DriveTransitionResult {
  message: string;
  drive: DriveRecord;
}

/** A round of a drive and its date (server/src/migrations/028_create_drive_rounds.sql). */
export interface DriveRound {
  round_no: number;
  /** null = TBD. */
  round_date: string | null;
}

/** Response body from POST /drive and PUT /drive/:driveId - the saved drive plus the freshly generated eligible list to review. */
export interface DriveWithEligible {
  message?: string;
  drive: DriveRecord;
  eligibleStudents: EligibleStudent[];
  /** Present (Phase 2) when the drive was created with an announcement. */
  announcement?: CompanyPostRecord | null;
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
 * Purpose: GET /drive/:driveId/eligible - (re)generate the eligible-students list
 * for an existing drive, so shortlist review can happen any time after creation
 * (decoupled from create/update). Returns the same { drive, eligibleStudents }
 * shape as create/update.
 */
export function getDriveEligible(id: number | string) {
  return axiosInstance
    .get<DriveWithEligible>(`/drive/${id}/eligible`)
    .then((res) => res.data);
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

/** Purpose: GET /drive/my-drives - the drives the current student is shortlisted into (self-scoped). */
export function getMyDrives() {
  return axiosInstance.get<MyDrive[]>("/drive/my-drives").then((res) => res.data);
}

/** Purpose: GET /drive/:driveId/my-results - the current student's own round-by-round progression. */
export function getMyDriveResults(driveId: number | string) {
  return axiosInstance
    .get<MyDriveResult[]>(`/drive/${driveId}/my-results`)
    .then((res) => res.data);
}

// --- Admin round-workflow transitions & actions ---------------------------

/** Purpose: POST /drive/:driveId/start-round-0 - lock the drive and send the shortlist to the company. */
export function startRoundZero(driveId: number | string) {
  return axiosInstance
    .post<DriveTransitionResult>(`/drive/${driveId}/start-round-0`)
    .then((res) => res.data);
}

/**
 * One checkbox decision committed at a stage finalize: the drive_student being
 * removed/rejected, plus the mandatory reason. An empty list at finalize means
 * every still-active candidate passes/clears the stage.
 */
export interface RoundDecision {
  driveStudentId: number;
  reason: string;
}

/**
 * Purpose: POST /drive/:driveId/finalize-prefilter - close pre-filter, open
 * attendance (rounds >= 1). `removed` are the unchecked candidates (batch commit).
 */
export function finalizePrefilter(
  driveId: number | string,
  removed: RoundDecision[] = [],
) {
  return axiosInstance
    .post<DriveTransitionResult>(`/drive/${driveId}/finalize-prefilter`, { removed })
    .then((res) => res.data);
}

/** Purpose: POST /drive/:driveId/finalize-attendance - close attendance, open results. */
export function finalizeAttendance(driveId: number | string) {
  return axiosInstance
    .post<DriveTransitionResult>(`/drive/${driveId}/finalize-attendance`)
    .then((res) => res.data);
}

/**
 * Purpose: POST /drive/:driveId/advance-round - resolve the round (unchecked
 * `rejected` candidates are eliminated, the rest clear) and open the next round.
 */
export function advanceRound(
  driveId: number | string,
  rejected: RoundDecision[] = [],
) {
  return axiosInstance
    .post<DriveTransitionResult>(`/drive/${driveId}/advance-round`, { rejected })
    .then((res) => res.data);
}

/**
 * Purpose: POST /drive/:driveId/complete - resolve the round then place all
 * cleared students and finish the drive. `rejected` are the unchecked candidates.
 */
export function completeDrive(
  driveId: number | string,
  rejected: RoundDecision[] = [],
) {
  return axiosInstance
    .post<DriveTransitionResult>(`/drive/${driveId}/complete`, { rejected })
    .then((res) => res.data);
}

/** Purpose: PATCH /drive/:driveId/students/:driveStudentId/attendance - mark present/absent. */
export function markAttendance(
  driveId: number | string,
  driveStudentId: number | string,
  present: boolean,
) {
  return axiosInstance
    .patch<{ message: string }>(
      `/drive/${driveId}/students/${driveStudentId}/attendance`,
      { present },
    )
    .then((res) => res.data);
}

/** Purpose: GET /drive/:driveId/history?round=N - a round's full history for every student (admin). */
export function getRoundHistory(driveId: number | string, round?: number) {
  return axiosInstance
    .get<RoundHistoryRow[]>(`/drive/${driveId}/history`, {
      params: round === undefined ? undefined : { round },
    })
    .then((res) => res.data);
}

/** Purpose: GET /drive/:driveId/rounds - every round of a drive with its date. */
export function getDriveRounds(driveId: number | string) {
  return axiosInstance
    .get<DriveRound[]>(`/drive/${driveId}/rounds`)
    .then((res) => res.data);
}

/** Purpose: PATCH /drive/:driveId/rounds/:roundNo/date - set/clear a round's date (notifies its students). */
export function setRoundDate(
  driveId: number | string,
  roundNo: number,
  round_date: string,
) {
  return axiosInstance
    .patch<{ message: string }>(`/drive/${driveId}/rounds/${roundNo}/date`, {
      round_date,
    })
    .then((res) => res.data);
}

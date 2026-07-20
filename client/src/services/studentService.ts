import { axiosInstance } from "../api/axiosInstance";

/**
 * Purpose: every Axios call for the `students` resource - profile fetch,
 * profile completion (create), profile edits, and the listing used by the
 * SPC/TPC/Admin screens - lives here. Components/hooks call these functions,
 * never axios directly.
 */

/** Full shape of a row from the `students` table (server/src/migrations/001_create_students.sql + 005_alter_students.sql), as returned by `SELECT *`. */
export interface StudentRecord {
  id: number;
  /**
   * FK to users.id. The createStudent controller now inserts this from the
   * authenticated user's id (req.user.userId), so profiles created through
   * POST /students are linked to their account and resolvable via
   * GET /students/me. May still be null for legacy rows created before that fix.
   */
  user_id: string | null;
  roll_no: string;
  name: string;
  email: string;
  phone: string | null;
  branch: string | null;
  department: string | null;
  batch: number | null;
  /** Postgres NUMERIC columns come back from `pg` as strings, not numbers - use Number(student.cgpa) before formatting/math. */
  cgpa: string | null;
  /**
   * 'placed' = won a placement drive (placed_package records the CTC).
   * 'second_chance' = won a >=2x drive while already placed - terminal state.
   */
  placement_status: "unplaced" | "shortlisted" | "placed" | "second_chance" | "rejected";
  /** CTC (LPA) they were placed at; basis of the 2x second-chance rule. NUMERIC -> string. */
  placed_package?: string | null;
  /** Independent flag - selected in an internship drive; never affects placement state. */
  selected_for_internship?: boolean;
  gender: string | null;
  region: string | null;
  religion: string | null;
  /** ISO date string, e.g. "2003-04-12". */
  date_of_birth: string | null;
  active_backlogs: number;
  passive_backlogs: number;
  resume_url: string | null;
  tenth_marksheet_url: string | null;
  twelfth_marksheet_url: string | null;
  last_sem_marksheet_url: string | null;
  /** Drive link to the placement-fee payment receipt (migration 039). */
  payment_receipt_url: string | null;
  /** Transaction/payment id issued for that payment (migration 039). */
  payment_id: string | null;
  /** Postgres NUMERIC columns - returned by `pg` as strings (use Number(...) for math). */
  tenth_percentage: string | null;
  twelfth_percentage: string | null;
  sem1_spi: string | null;
  sem2_spi: string | null;
  sem3_spi: string | null;
  sem4_spi: string | null;
  sem5_spi: string | null;
  sem6_spi: string | null;
  sem7_spi: string | null;
  sem8_spi: string | null;
  /**
   * Set by the SPC/TPC verification flow. Values: 'pending', 'spc_verified',
   * 'spc_rejected', 'verified' (TPC final), 'rejected' (TPC final). The generic
   * PUT /students/:id still doesn't set this - the dedicated /spc and /tpc
   * verify|reject endpoints do (see spcService.ts / tpcService.ts).
   */
  review_status: string | null;
  reviewed_at: string | null;
  /** Reason recorded when an SPC or TPC rejected the profile (migration 018). */
  rejection_reason: string | null;
  /** Current semester (5-8); drives which SPIs are required (migration 018). */
  semester: number | null;
  /** Which SPC is assigned to verify this student (migration 018); set by the TPC's assign action. */
  assigned_spc_id: number | null;
  /** Only present on GET /tpc/spc-verified rows: true when this student is themselves an SPC coordinator (they skip SPC review). */
  is_spc?: boolean;
  /**
   * Server-computed profile-completion flag. Backed by a Postgres STORED
   * GENERATED column (server/src/migrations/012_add_profile_complete.sql) -
   * TRUE only when every Complete Profile field is filled. Read-only: it is
   * never sent in create/update payloads. Optional here because rows created
   * before that migration ran will not include it.
   */
  is_profile_complete?: boolean;
  created_at: string;
}

/** Body accepted by POST /students (server/src/lib/schema.js createStudentSchema) - every field is required. */
export interface CreateStudentPayload {
  roll_no: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  department: string;
  batch: number;
  cgpa: number;
  semester: number;
  gender: string;
  region: string;
  religion: string;
  /** yyyy-mm-dd - the backend parses this with z.coerce.date(). */
  date_of_birth: string;
  active_backlogs: number;
  passive_backlogs: number;
  resume_url: string;
  tenth_marksheet_url: string;
  twelfth_marksheet_url: string;
  last_sem_marksheet_url: string;
  payment_receipt_url?: string;
  payment_id?: string;
  tenth_percentage: number;
  twelfth_percentage: number;
  sem1_spi?: number;
  sem2_spi?: number;
  sem3_spi?: number;
  sem4_spi?: number;
  sem5_spi?: number;
  sem6_spi?: number;
  sem7_spi?: number;
  sem8_spi?: number;
  placement_status: "unplaced" | "shortlisted" | "placed" | "rejected";
}

/**
 * Body accepted by PUT /students/:id (updateStudentSchema) - every field
 * optional, partial updates only. `review_status` is included here even
 * though it is not (yet) in updateStudentSchema - see the StudentRecord
 * note above - so the SPC/TPC verification screens can send the
 * semantically correct payload; the backend currently strips this field
 * silently rather than rejecting the request.
 */
export type UpdateStudentPayload = Partial<CreateStudentPayload> & {
  review_status?: string;
};

/**
 * Purpose: GET /students - list every student record (used by the SPC/TPC/Admin
 * dashboards). NOTE: this route has no `auth` middleware in
 * server/src/routes/studentRoutes.js, so it is currently reachable without a token.
 */
export function getStudents() {
  return axiosInstance.get<StudentRecord[]>("/students").then((res) => res.data);
}

/** Purpose: GET /students/:id - fetch a single student record for the review/verification screens. */
export function getStudentById(id: number | string) {
  return axiosInstance
    .get<StudentRecord>(`/students/${id}`)
    .then((res) => res.data);
}

/** Purpose: GET /students/me - fetch the signed-in student's own profile. A 404 here means the student has not completed their profile yet (see useProfile.ts). */
export function getMyProfile() {
  return axiosInstance.get<StudentRecord>("/students/me").then((res) => res.data);
}

/**
 * Purpose: POST /students - the Complete Profile step's create call.
 * The backend's createStudent controller now inserts `user_id` from the
 * authenticated account, so the new row is linked to the signed-in user and
 * is immediately resolvable via GET /students/me.
 */
export function createStudentProfile(payload: CreateStudentPayload) {
  return axiosInstance
    .post<StudentRecord>("/students", payload)
    .then((res) => res.data);
}

/** Purpose: PUT /students/:id - edit an existing student record (staff-only: SPC/TPC verification actions). Students edit their own profile via upsertMyProfile. */
export function updateStudent(id: number | string, payload: UpdateStudentPayload) {
  return axiosInstance
    .put<StudentRecord>(`/students/${id}`, payload)
    .then((res) => res.data);
}

/**
 * Purpose: PUT /students/me - the self-scoped, partial upsert behind the 4-part
 * profile wizard. Each wizard step sends only its own fields; the row is created
 * on the first save. CGPA is derived server-side (never sent). Resolves by the
 * authenticated user, so no student id is needed.
 */
export function upsertMyProfile(payload: UpdateStudentPayload) {
  return axiosInstance
    .put<StudentRecord>("/students/me", payload)
    .then((res) => res.data);
}

/** Purpose: DELETE /students/:id - remove a student record (Admin only by convention; the route itself has no role check). */
export function deleteStudent(id: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/students/${id}`)
    .then((res) => res.data);
}

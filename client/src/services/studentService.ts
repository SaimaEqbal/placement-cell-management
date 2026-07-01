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
  graduation_year: number | null;
  /** Postgres NUMERIC columns come back from `pg` as strings, not numbers - use Number(student.cgpa) before formatting/math. */
  cgpa: string | null;
  placement_status: "unplaced" | "shortlisted" | "placed" | "rejected";
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
  /** Set by SPC/TPC review. NOTE: updateStudentSchema (server/src/lib/schema.js) does not currently list this field, so PUT /students/:id silently drops it - see updateStudent() below. */
  review_status: string | null;
  reviewed_at: string | null;
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
  graduation_year: number;
  cgpa: number;
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

/** Purpose: PUT /students/:id - edit an existing student record (profile edits, and the base call behind SPC/TPC verification actions). */
export function updateStudent(id: number | string, payload: UpdateStudentPayload) {
  return axiosInstance
    .put<StudentRecord>(`/students/${id}`, payload)
    .then((res) => res.data);
}

/** Purpose: DELETE /students/:id - remove a student record (Admin only by convention; the route itself has no role check). */
export function deleteStudent(id: number | string) {
  return axiosInstance
    .delete<{ message: string }>(`/students/${id}`)
    .then((res) => res.data);
}

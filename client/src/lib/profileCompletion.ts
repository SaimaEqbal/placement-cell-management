import type { StudentRecord } from "../services/studentService";

/** Purpose: derive a 0-100 "profile completion" percentage from a student record for the Student Dashboard's "Profile Completion Percentage" requirement. The backend has no completion-percentage column, so this is computed client-side from how many of the fields collected during the Complete Profile step are actually filled in, rather than inventing a fake backend field. */
const TRACKED_FIELDS: Array<keyof StudentRecord> = [
  "phone",
  "branch",
  "batch",
  "cgpa",
  "gender",
  "region",
  "religion",
  "date_of_birth",
  "resume_url",
  "tenth_marksheet_url",
  "twelfth_marksheet_url",
  "last_sem_marksheet_url",
];

/** Purpose: percentage (0-100) of the tracked profile fields that are non-empty on this student record. */
export function computeProfileCompletion(student: StudentRecord): number {
  const filled = TRACKED_FIELDS.filter((field) => {
    const value = student[field];
    return value !== null && value !== undefined && value !== "";
  }).length;
  return Math.round((filled / TRACKED_FIELDS.length) * 100);
}
-- CHANGE: Added is_profile_complete boolean to the students table.
-- PROBLEM: The backend had no field to express whether a student's profile is
--          complete. Completion was only inferred on the client (a 404 from
--          GET /students/me, plus a field-count percentage in
--          client/src/lib/profileCompletion.ts). There was no server-side
--          source of truth that other endpoints / queries could rely on, and
--          the client StudentRecord type already referenced this column.
-- BEFORE:  students had no completion column.
-- AFTER:   is_profile_complete is a STORED GENERATED column: PostgreSQL
--          recomputes it automatically on every INSERT/UPDATE, so no
--          controller code has to set it (keeps the change minimal and avoids
--          touching the existing backend structure). It is TRUE only when all
--          of the fields the Complete Profile step collects are filled in -
--          deliberately mirroring the field list in
--          client/src/lib/profileCompletion.ts so the boolean agrees with the
--          client's "100% complete" state.
-- NOTE:    numbered 012 because 010/011 are already taken (create_drives,
--          create_invitations) in this codebase.

ALTER TABLE students
ADD COLUMN is_profile_complete BOOLEAN
GENERATED ALWAYS AS (
  phone IS NOT NULL
  AND branch IS NOT NULL
  AND graduation_year IS NOT NULL
  AND cgpa IS NOT NULL
  AND gender IS NOT NULL
  AND region IS NOT NULL
  AND religion IS NOT NULL
  AND date_of_birth IS NOT NULL
  AND resume_url IS NOT NULL
  AND tenth_marksheet_url IS NOT NULL
  AND twelfth_marksheet_url IS NOT NULL
  AND last_sem_marksheet_url IS NOT NULL
) STORED;

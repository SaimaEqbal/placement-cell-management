-- Adds is_profile_complete: a STORED GENERATED boolean that PostgreSQL
-- recomputes on every INSERT/UPDATE, TRUE only when every Complete-Profile
-- field is filled in.

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

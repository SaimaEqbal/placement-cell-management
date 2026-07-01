-- Branch labels collected by the profile form exceed branch's original
-- VARCHAR(50). Widen it. is_profile_complete (012) is a generated column that
-- references branch, and Postgres won't alter the type of a column a generated
-- column depends on - so drop it, widen branch, then recreate it unchanged.
ALTER TABLE students DROP COLUMN IF EXISTS is_profile_complete;

ALTER TABLE students ALTER COLUMN branch TYPE VARCHAR(150);

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

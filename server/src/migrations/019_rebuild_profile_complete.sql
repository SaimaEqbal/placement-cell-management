-- is_profile_complete (012/015) is a STORED generated column; Postgres won't let
-- us reference the new `semester`/SPI requirement without recreating it. Same
-- drop-then-recreate technique as migration 015.
--
-- New rules on top of the base fields: `semester` must be set, and the student
-- must have SPIs for every completed semester (1 .. semester-1). Valid semesters
-- are 5-8, so sem1-sem4 are always required; sem5/sem6/sem7 are required only
-- when the student has reached semester 6/7/8 respectively. sem8_spi is never
-- required (a semester-8 student has not finished semester 8).
ALTER TABLE students DROP COLUMN IF EXISTS is_profile_complete;

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
  AND semester IS NOT NULL
  AND sem1_spi IS NOT NULL
  AND sem2_spi IS NOT NULL
  AND sem3_spi IS NOT NULL
  AND sem4_spi IS NOT NULL
  AND (semester < 6 OR sem5_spi IS NOT NULL)
  AND (semester < 7 OR sem6_spi IS NOT NULL)
  AND (semester < 8 OR sem7_spi IS NOT NULL)
) STORED;

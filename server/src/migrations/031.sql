-- Migration 031: roll back the Google Drive document-upload model (migration 030)
-- back to pasted document URLs.
--
-- The upload flow proved too cumbersome/brittle; documents go back to being
-- hosted URLs pasted into the profile. This restores the four *_url columns and
-- points is_profile_complete at them again (the pre-030 / migration-019 rules),
-- and drops the now-unused *_file_id / *_uploaded_at columns.
--
-- is_profile_complete is a STORED generated column, so it must be dropped before
-- the columns it references change, then recreated. SAFE TO RE-RUN: guarded
-- ADD/DROP; the generated column is unconditionally dropped and recreated.

-- 1. Drop the generated column (references the file-id columns).
ALTER TABLE students DROP COLUMN IF EXISTS is_profile_complete;

-- 2. Restore the URL columns.
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url             TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenth_marksheet_url    TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS twelfth_marksheet_url  TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_sem_marksheet_url TEXT;

-- 3. Drop the file-id / timestamp columns added by migration 030.
ALTER TABLE students DROP COLUMN IF EXISTS resume_file_id;
ALTER TABLE students DROP COLUMN IF EXISTS resume_uploaded_at;
ALTER TABLE students DROP COLUMN IF EXISTS tenth_marksheet_file_id;
ALTER TABLE students DROP COLUMN IF EXISTS tenth_marksheet_uploaded_at;
ALTER TABLE students DROP COLUMN IF EXISTS twelfth_marksheet_file_id;
ALTER TABLE students DROP COLUMN IF EXISTS twelfth_marksheet_uploaded_at;
ALTER TABLE students DROP COLUMN IF EXISTS last_sem_marksheet_file_id;
ALTER TABLE students DROP COLUMN IF EXISTS last_sem_marksheet_uploaded_at;

-- 4. Recreate is_profile_complete against the URL columns (identical to 019).
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

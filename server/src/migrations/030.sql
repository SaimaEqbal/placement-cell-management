-- Migration 030: replace student document URL columns with Google Drive file-ID
-- references, and repoint is_profile_complete at them.
--
-- Students no longer paste hosted URLs; the four required documents (resume, 10th
-- / 12th / latest-semester marksheets) are uploaded as PDFs to a private Google
-- Drive folder and referenced by Drive file ID + upload timestamp. Only PDFs,
-- deterministic filenames — so no filename/mime columns are stored (spec §7).
--
-- is_profile_complete is a STORED generated column that currently references the
-- *_url columns, so it must be dropped before those columns can be dropped, then
-- recreated against the new *_file_id columns (Postgres can't ALTER a generated
-- expression in place). All other completion rules are unchanged.
--
-- DESTRUCTIVE: drops the four *_url columns (spec §7 confirms there are no real
-- uploads to migrate). SAFE TO RE-RUN: guarded ADD/DROP; the generated column is
-- unconditionally dropped and recreated.

-- 1. Drop the generated column first (it references the url columns).
ALTER TABLE students DROP COLUMN IF EXISTS is_profile_complete;

-- 2. Add the new document reference columns.
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_file_id                TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_uploaded_at            TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenth_marksheet_file_id       TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenth_marksheet_uploaded_at   TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS twelfth_marksheet_file_id     TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS twelfth_marksheet_uploaded_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_sem_marksheet_file_id    TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_sem_marksheet_uploaded_at TIMESTAMPTZ;

-- 3. Drop the obsolete url columns (safe now the generated column is gone).
ALTER TABLE students DROP COLUMN IF EXISTS resume_url;
ALTER TABLE students DROP COLUMN IF EXISTS tenth_marksheet_url;
ALTER TABLE students DROP COLUMN IF EXISTS twelfth_marksheet_url;
ALTER TABLE students DROP COLUMN IF EXISTS last_sem_marksheet_url;

-- 4. Recreate is_profile_complete: identical to migration 019 EXCEPT the four
--    document checks now key off the new *_file_id columns. Personal + academic
--    rules are preserved verbatim.
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
  AND resume_file_id IS NOT NULL
  AND tenth_marksheet_file_id IS NOT NULL
  AND twelfth_marksheet_file_id IS NOT NULL
  AND last_sem_marksheet_file_id IS NOT NULL
  AND semester IS NOT NULL
  AND sem1_spi IS NOT NULL
  AND sem2_spi IS NOT NULL
  AND sem3_spi IS NOT NULL
  AND sem4_spi IS NOT NULL
  AND (semester < 6 OR sem5_spi IS NOT NULL)
  AND (semester < 7 OR sem6_spi IS NOT NULL)
  AND (semester < 8 OR sem7_spi IS NOT NULL)
) STORED;

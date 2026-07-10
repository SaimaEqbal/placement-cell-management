-- Migration 022: reconcile the live schema to the intended 001-021 state.
--
-- The database was migrated by hand and drifted from the numbered sequence:
-- some ALTERs landed, others didn't (notably students.rejection_reason and
-- students.assigned_spc_id from 018 were never added, which 500s TPC/SPC verify,
-- reject, and SPC assignment). This script brings any partially-migrated
-- instance to the correct final state.
--
-- SAFE TO RE-RUN: every statement is guarded (ADD COLUMN IF NOT EXISTS,
-- DROP NOT NULL, information_schema checks, prefix-checked UPDATEs), so running
-- it again is a no-op. It never DROPs a column, never recreates a table, and
-- never moves data between columns. It assumes the base tables already exist
-- (they do, per the current schema); it does not bootstrap a fresh database.

-- ---------------------------------------------------------------------------
-- 1. students: profile columns (migration 005) - no-ops where already present
-- ---------------------------------------------------------------------------
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender                VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS region                VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion              VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth         DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS active_backlogs       INT DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS passive_backlogs      INT DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url            TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenth_marksheet_url   TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS twelfth_marksheet_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_sem_marksheet_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS review_status         VARCHAR(20) DEFAULT 'pending';
ALTER TABLE students ADD COLUMN IF NOT EXISTS reviewed_at           TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id               UUID UNIQUE REFERENCES users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS department            VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenth_percentage      NUMERIC(5,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS twelfth_percentage    NUMERIC(5,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem1_spi              NUMERIC(4,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem2_spi              NUMERIC(4,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem3_spi              NUMERIC(4,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem4_spi              NUMERIC(4,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem5_spi              NUMERIC(4,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem6_spi              NUMERIC(4,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem7_spi              NUMERIC(4,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sem8_spi              NUMERIC(4,2);

-- ---------------------------------------------------------------------------
-- 2. students: verification-workflow columns (migration 018)
--    THIS is the gap that breaks verify/reject/assignment on the current DB.
-- ---------------------------------------------------------------------------
ALTER TABLE students ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester         INT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS assigned_spc_id  INT
  REFERENCES spc(spc_id) ON DELETE SET NULL;

-- Keep the semester range check (from 018), added only if it isn't there yet.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'students' AND column_name = 'semester'
      AND constraint_name = 'students_semester_check'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_semester_check CHECK (semester BETWEEN 5 AND 8);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. students: is_profile_complete generated column (migrations 012/015/019)
--    Added only if missing; recreating it in-place is intentionally avoided.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'is_profile_complete'
  ) THEN
    ALTER TABLE students ADD COLUMN is_profile_complete BOOLEAN
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
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. tpc: department/branch split (migration 016)
--    tpc.department = the department the TPC oversees (used for scoping).
--    tpc.branch     = optional finer-grained branch; MUST be nullable so an
--                     invite that omits the branch doesn't hit a NOT NULL error.
-- ---------------------------------------------------------------------------
ALTER TABLE tpc ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE tpc ADD COLUMN IF NOT EXISTS branch     VARCHAR(150);
ALTER TABLE tpc ALTER COLUMN branch DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. spc: department/branch split (migration 017)
--    spc.department (used for scoping) + spc.branch (the SPC's specific branch,
--    populated at promote time).
-- ---------------------------------------------------------------------------
ALTER TABLE spc ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE spc ADD COLUMN IF NOT EXISTS branch     VARCHAR(150);

-- ---------------------------------------------------------------------------
-- 6. Canonical department naming (migration 021)
--    Every department string is stored WITH the "Department of " prefix so the
--    verification invariant (tpc.department = students.department) holds. Only
--    un-prefixed, non-empty rows are touched -> idempotent.
-- ---------------------------------------------------------------------------
UPDATE students SET department = 'Department of ' || department
WHERE department IS NOT NULL AND department <> '' AND department NOT LIKE 'Department of %';

UPDATE tpc SET department = 'Department of ' || department
WHERE department IS NOT NULL AND department <> '' AND department NOT LIKE 'Department of %';

UPDATE spc SET department = 'Department of ' || department
WHERE department IS NOT NULL AND department <> '' AND department NOT LIKE 'Department of %';

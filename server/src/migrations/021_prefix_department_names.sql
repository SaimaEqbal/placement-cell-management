-- Unify department naming on the canonical "Department of ..." form.
--
-- The frontend previously had two department vocabularies: student/TPC forms
-- stored the bare name ("Computer Engineering") while admin filter dropdowns
-- used the prefixed name ("Department of Computer Engineering"), so the filters
-- never matched any stored row. lib/validation.ts now uses the prefixed form
-- everywhere; this migration rewrites existing rows to match.
--
-- Idempotent: only rows that don't already carry the prefix are touched, so it
-- is safe to re-run. Empty/NULL departments are left untouched.

UPDATE students
SET department = 'Department of ' || department
WHERE department IS NOT NULL
  AND department <> ''
  AND department NOT LIKE 'Department of %';

UPDATE tpc
SET department = 'Department of ' || department
WHERE department IS NOT NULL
  AND department <> ''
  AND department NOT LIKE 'Department of %';

UPDATE spc
SET department = 'Department of ' || department
WHERE department IS NOT NULL
  AND department <> ''
  AND department NOT LIKE 'Department of %';

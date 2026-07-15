-- Migration 027: repair drive_students_status_check.
--
-- A drive_students_status_check constraint already existed on the live DB with
-- the OLD lowercase vocabulary ('shortlisted','rejected','selected','not_selected').
-- Migration 025 guarded its new CHECK by constraint NAME, saw that name already
-- present, and skipped - so the stale lowercase-only constraint stayed in place
-- and rejected the new uppercase 'SHORTLISTED' value on confirm.
--
-- This migration replaces it unconditionally: drop first, normalize any existing
-- rows to the new vocabulary, then add the correct CHECK. Ordering matters - the
-- normalizing UPDATEs must run AFTER the old (stricter) constraint is dropped.
--
-- SAFE TO RE-RUN: DROP ... IF EXISTS then ADD; the UPDATEs are no-ops once values
-- are already uppercase.

ALTER TABLE drive_students DROP CONSTRAINT IF EXISTS drive_students_status_check;

UPDATE drive_students SET status = 'SHORTLISTED' WHERE status = 'shortlisted';
UPDATE drive_students SET status = 'SELECTED'    WHERE status = 'selected';
UPDATE drive_students SET status = 'REJECTED'    WHERE status IN ('not_selected', 'rejected');

ALTER TABLE drive_students ADD CONSTRAINT drive_students_status_check
  CHECK (status IN (
    'SHORTLISTED', 'ACTIVE', 'SELECTED', 'REJECTED', 'ABSENT', 'REMOVED', 'PLACED'
  ));

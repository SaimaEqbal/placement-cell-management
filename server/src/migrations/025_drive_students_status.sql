-- Migration 025: normalize drive_students.status to the round-workflow vocabulary
-- and add a transient per-round attendance mark.
--
-- The status column previously held lowercase values ('shortlisted', 'selected',
-- 'not_selected') enforced only by controller code. The round workflow uses an
-- uppercase set representing the student's CURRENT state within the drive:
--
--   SHORTLISTED : confirmed onto the tentative shortlist (pre Round 0)
--   ACTIVE      : still in the running for the current/next round
--   SELECTED    : selected in a round (transient between rounds; carried as ACTIVE)
--   REJECTED    : rejected in a round (terminal for the student)
--   ABSENT      : marked absent at an attendance stage (terminal)
--   REMOVED     : removed during a pre-filter (terminal)
--   PLACED      : selected in the final round -> placed
--
-- attendance_mark is a TRANSIENT per-round mark (PRESENT|ABSENT) that stays
-- editable until finalize-attendance batches it into drive_round_history and
-- flips ABSENT students to status='ABSENT'. It is cleared on each round advance.
-- Keeping it off the append-only history lets an admin correct a mark before
-- finalising.
--
-- SAFE TO RE-RUN: the UPDATEs are no-ops once values are already uppercase, and
-- the constraints are added only if absent. The status UPDATEs run BEFORE the
-- CHECK is added so a partially-migrated table can't fail the constraint.

UPDATE drive_students SET status = 'SHORTLISTED' WHERE status = 'shortlisted';
UPDATE drive_students SET status = 'SELECTED'    WHERE status = 'selected';
UPDATE drive_students SET status = 'REJECTED'    WHERE status = 'not_selected';

ALTER TABLE drive_students ALTER COLUMN status SET DEFAULT 'SHORTLISTED';

ALTER TABLE drive_students ADD COLUMN IF NOT EXISTS attendance_mark VARCHAR(10);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'drive_students' AND constraint_name = 'drive_students_status_check'
  ) THEN
    ALTER TABLE drive_students ADD CONSTRAINT drive_students_status_check
      CHECK (status IN (
        'SHORTLISTED', 'ACTIVE', 'SELECTED', 'REJECTED', 'ABSENT', 'REMOVED', 'PLACED'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'drive_students' AND constraint_name = 'drive_students_attendance_mark_check'
  ) THEN
    ALTER TABLE drive_students ADD CONSTRAINT drive_students_attendance_mark_check
      CHECK (attendance_mark IS NULL OR attendance_mark IN ('PRESENT', 'ABSENT'));
  END IF;
END $$;

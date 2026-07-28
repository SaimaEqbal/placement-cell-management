-- Migration 042: restore the capacity column required by the automatic SPC
-- verification queue. Existing deployments already have the active count but
-- were missing the matching maximum, causing promotion/demotion transactions
-- to fail when the queue helper checked capacity.
ALTER TABLE spc
ADD COLUMN IF NOT EXISTS max_active_assignments INT NOT NULL DEFAULT 10;

UPDATE spc
SET active_verification_count = (
  SELECT COUNT(*)
  FROM students
  WHERE students.assigned_spc_id = spc.spc_id
    AND students.review_status = 'pending'
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'spc_max_active_assignments_positive'
  ) THEN
    ALTER TABLE spc
      ADD CONSTRAINT spc_max_active_assignments_positive
      CHECK (max_active_assignments > 0);
  END IF;
END $$;

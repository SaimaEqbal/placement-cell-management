-- Migration 024: drive lifecycle columns for the round-based recruitment workflow.
--
-- A drive is no longer a flat "confirm a shortlist" record; it is a locked,
-- multi-round pipeline driven entirely by the administrator. These columns track
-- where a drive is in that pipeline:
--
--   current_round : -1 shortlisting · 0 resume screening · 1..N interview rounds
--   drive_state   : SHORTLISTING | ROUND_IN_PROGRESS | COMPLETED (authoritative)
--   round_stage   : sub-stage within a round >= 1 (PREFILTER|ATTENDANCE|RESULT);
--                   NULL while SHORTLISTING; round 0 (screening) sits at RESULT.
--   is_locked     : flips TRUE at Start Round 0 and never returns to FALSE.
--
-- NOTE: the existing drives.status (upcoming/ongoing/completed/cancelled) is left
-- untouched and kept only loosely in sync by the controller; drive_state is the
-- authoritative lifecycle column. Never gate logic on status.
--
-- SAFE TO RE-RUN: guarded ADD COLUMN / constraint checks; backfills only NULLs.

ALTER TABLE drives ADD COLUMN IF NOT EXISTS current_round INT DEFAULT -1;
ALTER TABLE drives ADD COLUMN IF NOT EXISTS drive_state   VARCHAR(30) DEFAULT 'SHORTLISTING';
ALTER TABLE drives ADD COLUMN IF NOT EXISTS round_stage   VARCHAR(20);   -- NULL while SHORTLISTING
ALTER TABLE drives ADD COLUMN IF NOT EXISTS is_locked     BOOLEAN DEFAULT FALSE;

-- Backfill any pre-existing rows (columns added above default only for new rows).
UPDATE drives SET current_round = -1           WHERE current_round IS NULL;
UPDATE drives SET drive_state   = 'SHORTLISTING' WHERE drive_state IS NULL;
UPDATE drives SET is_locked     = FALSE         WHERE is_locked   IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'drives' AND constraint_name = 'drives_drive_state_check'
  ) THEN
    ALTER TABLE drives ADD CONSTRAINT drives_drive_state_check
      CHECK (drive_state IN ('SHORTLISTING', 'ROUND_IN_PROGRESS', 'COMPLETED'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'drives' AND constraint_name = 'drives_round_stage_check'
  ) THEN
    ALTER TABLE drives ADD CONSTRAINT drives_round_stage_check
      CHECK (round_stage IS NULL OR round_stage IN ('PREFILTER', 'ATTENDANCE', 'RESULT'));
  END IF;
END $$;

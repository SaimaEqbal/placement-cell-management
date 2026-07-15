-- Migration 029: drop the drive-level dates.
--
-- Students no longer apply to drives, and scheduling now happens per round
-- (drive_rounds.round_date), so drives.drive_date and drives.application_deadline
-- are obsolete. DESTRUCTIVE: this removes those columns and any data in them.
--
-- SAFE TO RE-RUN: DROP COLUMN IF EXISTS.

ALTER TABLE drives DROP COLUMN IF EXISTS drive_date;
ALTER TABLE drives DROP COLUMN IF EXISTS application_deadline;

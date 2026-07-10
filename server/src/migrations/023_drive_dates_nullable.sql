-- Migration 023: allow a drive's date and application deadline to be "TBD".
--
-- Drives can be announced before their date/deadline is finalised. The UI now
-- offers a "TBD" option on those fields; the controller stores TBD as NULL, so
-- the columns must be nullable. Safe to re-run (DROP NOT NULL is idempotent).

ALTER TABLE drives ALTER COLUMN drive_date DROP NOT NULL;
ALTER TABLE drives ALTER COLUMN application_deadline DROP NOT NULL;

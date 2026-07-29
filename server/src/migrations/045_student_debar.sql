-- Absentee debarment.
--
-- debar_remaining_drives: how many more ELIGIBLE drives the student must sit out
-- because they were marked absent in an interview round.
--   0 = eligible
--   1 = skip the next eligible drive
--   2 = skip the next two eligible drives
--
-- Set to 2 when a student is finalised ABSENT in a round (finalizeAttendance).
-- Decremented by one each time a drive the student would otherwise have been
-- eligible for is finalised at company screening (startRoundZero), so the penalty
-- tracks the next two ELIGIBLE drives rather than the next two drives created.

ALTER TABLE students
    ADD COLUMN debar_remaining_drives INTEGER NOT NULL DEFAULT 0;

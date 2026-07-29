-- Move the placement offer from the student row onto the placement record.
--
-- Rationale: the FINAL offer a company makes (role + package) often differs from
-- the package ADVERTISED on the drive, and a student can be placed via more than
-- one drive (the second-chance rule), so a single per-student value cannot
-- represent placement history faithfully. The offer therefore lives on the
-- drive_students row (the placement record) instead of students.placed_package.
--
-- final_role / final_package: the actual offered role and CTC (LPA), captured and
-- editable by the admin at drive finalization (defaulting to the drive's
-- job_role / package_ctc). NULL for non-placed rows.
--
-- offer_taken: whether the student accepted this offer. Defaults to TRUE. Purely
-- informational - it does NOT affect placement_status, placed counts, or
-- second-chance eligibility. When a student wins a second-chance placement, their
-- earlier placement(s) are auto-flipped to FALSE (they moved to the better offer);
-- the admin can also toggle it manually after a drive completes.

ALTER TABLE drive_students
    ADD COLUMN final_role    VARCHAR(255),
    ADD COLUMN final_package NUMERIC(10,2),
    ADD COLUMN offer_taken   BOOLEAN NOT NULL DEFAULT TRUE;

-- The advertised drive package still gates second-chance eligibility, but the
-- placed student's prior package is now derived from drive_students.final_package
-- (see getEligibleStudentsForDrive), so this denormalised column is redundant.
ALTER TABLE students
    DROP COLUMN placed_package;

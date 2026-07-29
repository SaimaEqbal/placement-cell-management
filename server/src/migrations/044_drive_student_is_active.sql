-- Student withdrawal + persistent shortlist.
--
-- is_active: whether the shortlisted student is still in the running for the drive.
--   TRUE  -> in the shortlist (default; every existing row starts active).
--   FALSE -> the student has withdrawn (self-service, before company screening and
--            within 2 days of being shortlisted).
--
-- Withdrawn students are NOT deleted from drive_students: keeping the row preserves
-- audit/withdrawal history and statistics. Only is_active = TRUE students are
-- forwarded to the company at Start Company Screening (see startRoundZero).

ALTER TABLE drive_students
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

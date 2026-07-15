-- Drives can target one or more student batches (graduation years). A batch is
-- students.graduation_year (an INT, e.g. 2027). New drives must specify at least
-- one batch (enforced by createDriveSchema); the eligibility engine then filters
-- students to those whose graduation_year is in the drive's allowed_batches.
--
-- The column is nullable so existing drives remain unrestricted by batch: the
-- eligibility query treats NULL allowed_batches as "no batch filter".

ALTER TABLE drives
    ADD COLUMN allowed_batches INT[];

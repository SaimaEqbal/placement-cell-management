-- Same split as migration 016 (tpc): the spc table's single `branch` column is
-- renamed to `department`, and a new `branch` VARCHAR(150) is added. Unlike a
-- TPC, an SPC IS tied to a specific branch (verification is divided per
-- department+branch+semester), so promoteSPC now populates both columns from
-- the student's own record.
ALTER TABLE spc RENAME COLUMN branch TO department;

ALTER TABLE spc ADD COLUMN branch VARCHAR(150);

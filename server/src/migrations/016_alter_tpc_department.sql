-- Departments and branches are now separate concepts. The tpc table's single
-- `branch` column actually held a department-level value, so rename it to
-- `department` and add a new, finer-grained `branch` (nullable; a TPC oversees a
-- whole department and may not be tied to one branch). Matches the students
-- table, whose `branch` was already widened to VARCHAR(150) in migration 015.
ALTER TABLE tpc RENAME COLUMN branch TO department;

ALTER TABLE tpc ADD COLUMN branch VARCHAR(150);

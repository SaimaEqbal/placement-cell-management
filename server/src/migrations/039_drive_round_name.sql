-- Optional per-round name. Every round can be given a name (e.g. "Technical
-- Interview", "HR Round"); when absent the UI falls back to "Round N". Captured
-- alongside the mandatory round date at the post-prefilter (attendance) prompt.

ALTER TABLE drive_rounds
    ADD COLUMN round_name VARCHAR(100);

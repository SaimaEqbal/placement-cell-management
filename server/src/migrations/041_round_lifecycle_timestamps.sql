-- Per-round lifecycle timestamps, stamped by the workflow transitions:
--   * started_at   - when the round began. Round 0 ("Company screening") starts
--                    when the screening is confirmed (start-round-0); round N
--                    starts when "Run Round N" is clicked (advance-round).
--   * concluded_at - when the round ended: advancing to the next round (or
--                    completing the drive) concludes the current round.
-- NULL on legacy rounds recorded before this migration.

ALTER TABLE drive_rounds
    ADD COLUMN started_at TIMESTAMPTZ;

ALTER TABLE drive_rounds
    ADD COLUMN concluded_at TIMESTAMPTZ;

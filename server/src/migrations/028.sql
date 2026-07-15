-- Migration 028: per-round metadata (currently just the round's date).
--
-- Rounds are not declared up front, so each round gets a row here when it opens
-- (round 0 at Start Round 0; round N at advance-round). round_date defaults NULL
-- ("TBD") and the admin sets it once the company communicates the schedule; that
-- edit notifies the students shortlisted for the round. Cascades on drive delete.
--
-- SAFE TO RE-RUN: CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS drive_rounds (
    drive_id   INTEGER NOT NULL
        REFERENCES drives(drive_id)
        ON DELETE CASCADE,

    round_no   INT NOT NULL,

    round_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (drive_id, round_no)
);

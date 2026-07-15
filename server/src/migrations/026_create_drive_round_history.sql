-- Migration 026: drive_round_history - the permanent, append-only audit trail.
--
-- drive_students holds only the CURRENT state of a student in a drive. This table
-- records every significant EVENT so nothing is lost when a student's current
-- status changes. It is never updated or deleted (except FK cascade when a drive
-- is deleted). Every stage transition and per-student action appends one row here
-- inside the same transaction that mutates drive_students.
--
--   stage  : SHORTLIST | PREFILTER | ATTENDANCE | RESULT
--   result : SHORTLISTED | REMOVED | PRESENT | ABSENT | SELECTED | REJECTED | PLACED
--   round_no : the round the event belongs to (SHORTLIST rows use round_no = 0;
--              a pre-filter removal before round N is recorded against round N).
--
-- Column types mirror the referenced PKs exactly (drives.drive_id int4,
-- students.id int8, users.id uuid), consistent with 020_create_drive_students.sql.
--
-- SAFE TO RE-RUN: CREATE TABLE / CREATE INDEX IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS drive_round_history (
    history_id  BIGSERIAL PRIMARY KEY,

    drive_id    INTEGER NOT NULL
        REFERENCES drives(drive_id)
        ON DELETE CASCADE,

    student_id  BIGINT NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    round_no    INT NOT NULL,

    stage       VARCHAR(30) NOT NULL
        CHECK (stage IN ('SHORTLIST', 'PREFILTER', 'ATTENDANCE', 'RESULT')),

    result      VARCHAR(30) NOT NULL
        CHECK (result IN (
            'SHORTLISTED', 'REMOVED', 'PRESENT', 'ABSENT', 'SELECTED', 'REJECTED', 'PLACED'
        )),

    reason      TEXT,

    recorded_by UUID
        REFERENCES users(id),

    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drh_drive_round
    ON drive_round_history(drive_id, round_no);

CREATE INDEX IF NOT EXISTS idx_drh_drive_student
    ON drive_round_history(drive_id, student_id);

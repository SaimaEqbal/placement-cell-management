-- Purpose: the confirmed shortlist for a drive. Students no longer apply to
-- drives; an admin reviews the auto-generated eligible list and confirms a
-- subset, which is persisted here (see driveController.js confirmStudents /
-- getDriveStudents / markSelected / markRejected / removeStudent).
--
-- Column types mirror the referenced PKs exactly: drives.drive_id is SERIAL
-- (int4), students.id is BIGSERIAL (int8), users.id is UUID.
CREATE TABLE IF NOT EXISTS drive_students (
    drive_student_id BIGSERIAL PRIMARY KEY,

    drive_id INTEGER NOT NULL
        REFERENCES drives(drive_id)
        ON DELETE CASCADE,

    student_id BIGINT NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    current_round INTEGER DEFAULT 0,

    status VARCHAR(30) DEFAULT 'shortlisted',

    remarks TEXT,

    added_by UUID
        REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- A student can only appear once per drive (guards the confirm/manual-add paths).
    UNIQUE (drive_id, student_id)
);

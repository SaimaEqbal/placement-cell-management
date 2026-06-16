CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,

    student_id INT NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    drive_id INT NOT NULL
        REFERENCES drives(drive_id)
        ON DELETE CASCADE,

    current_round INT DEFAULT 0
        CHECK (current_round >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected',
                'selected',
                'not_selected'
            )
        ),

    applied_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (student_id, drive_id)
);
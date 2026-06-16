CREATE TABLE drives (
    drive_id SERIAL PRIMARY KEY,

    company_id INT NOT NULL
        REFERENCES companies(company_id)
        ON DELETE CASCADE,

    job_role VARCHAR(255),

    job_description TEXT,

    package_ctc NUMERIC(10,2),

    employment_type VARCHAR(50) NOT NULL,

    drive_date DATE NOT NULL,

    application_deadline DATE NOT NULL,

    minimum_cgpa NUMERIC(3,2) NOT NULL,

    allowed_branches TEXT[] NOT NULL,

    max_active_backlogs INT DEFAULT 0,

    max_passive_backlogs INT DEFAULT 0,

    number_of_rounds INT DEFAULT 0,

    status VARCHAR(20) DEFAULT 'upcoming'
        CHECK (status IN (
            'upcoming',
            'ongoing',
            'completed',
            'cancelled'
        )),

    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);
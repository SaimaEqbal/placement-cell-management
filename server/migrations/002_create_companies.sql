CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    job_role VARCHAR(100) NOT NULL,
    package_lpa NUMERIC(5,2),
    minimum_cgpa NUMERIC(3,2),
    allowed_branches TEXT[],
    backlog_allowed BOOLEAN DEFAULT FALSE,
    job_type VARCHAR(20),
    drive_date DATE,
    application_deadline DATE,
    location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
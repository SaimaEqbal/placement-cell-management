CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,

    student_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,

    status VARCHAR(30) DEFAULT 'Applied',

    applied_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_student
        FOREIGN KEY(student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_company
        FOREIGN KEY(company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);
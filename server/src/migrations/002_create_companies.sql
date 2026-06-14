CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,

    company_name VARCHAR(255) NOT NULL,

    industry VARCHAR(100),

    description TEXT,

    hr_name VARCHAR(100) NOT NULL,

    hr_email VARCHAR(255) NOT NULL,

    hr_phone VARCHAR(15) NOT NULL,

    created_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE companies
    ALTER COLUMN hr_name DROP NOT NULL,
    ALTER COLUMN hr_email DROP NOT NULL,
    ALTER COLUMN hr_phone DROP NOT NULL;
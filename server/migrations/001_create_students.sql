CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    branch VARCHAR(50),
    graduation_year INT,
    cgpa NUMERIC(3,2),
    placement_status VARCHAR(20) DEFAULT 'unplaced',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
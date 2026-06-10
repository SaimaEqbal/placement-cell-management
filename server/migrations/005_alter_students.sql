ALTER TABLE students
ADD COLUMN gender VARCHAR(20),
ADD COLUMN region VARCHAR(100),
ADD COLUMN religion VARCHAR(50),
ADD COLUMN date_of_birth DATE,
ADD COLUMN active_backlogs INT DEFAULT 0,
ADD COLUMN passive_backlogs INT DEFAULT 0,
ADD COLUMN resume_url TEXT,
ADD COLUMN tenth_marksheet_url TEXT,
ADD COLUMN twelfth_marksheet_url TEXT,
ADD COLUMN last_sem_marksheet_url TEXT;
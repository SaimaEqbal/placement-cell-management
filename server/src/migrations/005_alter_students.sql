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

ALTER TABLE students
ADD COLUMN review_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN reviewed_at TIMESTAMPTZ;

ALTER TABLE students
ADD COLUMN user_id UUID UNIQUE REFERENCES users(id);

ALTER TABLE students
ADD COLUMN department VARCHAR(100),

ADD COLUMN tenth_percentage NUMERIC(5,2),
ADD COLUMN twelfth_percentage NUMERIC(5,2),

ADD COLUMN sem1_spi NUMERIC(4,2),
ADD COLUMN sem2_spi NUMERIC(4,2),
ADD COLUMN sem3_spi NUMERIC(4,2),
ADD COLUMN sem4_spi NUMERIC(4,2),
ADD COLUMN sem5_spi NUMERIC(4,2),
ADD COLUMN sem6_spi NUMERIC(4,2),
ADD COLUMN sem7_spi NUMERIC(4,2),
ADD COLUMN sem8_spi NUMERIC(4,2);
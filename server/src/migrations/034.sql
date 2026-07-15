BEGIN;

-- ============================================================
-- PLACEMENT SYSTEM TEST DATA
--
-- 10 branches
-- 2 graduation years: 2027, 2028
-- 20 students / branch / graduation year
--
-- TOTAL STUDENTS: 400
-- TOTAL TPCs:      10
--
-- Password hashes are placeholders and can be changed later.
-- ============================================================


-- ============================================================
-- BRANCH CONFIGURATION
-- ============================================================

CREATE TEMP TABLE seed_branches (
    branch_code TEXT PRIMARY KEY,
    department TEXT NOT NULL,
    branch TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_branches (branch_code, department, branch)
VALUES
(
    'COE',
    'Department of Computer Engineering',
    'B.Tech. Computer Engineering'
),
(
    'CSEDS',
    'Department of Computer Engineering',
    'B.Tech. Computer Science & Engineering (Data Sciences) (Self-financed)'
),
(
    'ECE',
    'Department of Electronics & Communication Engineering',
    'B.Tech. (Electronics & Communication Engineering)'
),
(
    'VLSI',
    'Department of Electronics & Communication Engineering',
    'B.Tech. Electronics (VLSI Design & Technology)'
),
(
    'EE',
    'Department of Electrical Engineering',
    'B.Tech. (Electrical Engineering)'
),
(
    'ECEE',
    'Department of Electrical Engineering',
    'B.Tech. (Electrical & Computer Engineering)'
),
(
    'ME',
    'Department of Mechanical Engineering',
    'B.Tech. (Mechanical Engineering)'
),
(
    'RAI',
    'Department of Mechanical Engineering',
    'B.Tech. (Robotics & Artificial Intelligence) (Self-Financed)'
),
(
    'CE',
    'Department of Civil Engineering',
    'B.Tech. (Civil Engineering)'
),
(
    'CT',
    'Department of Civil Engineering',
    'B.Tech. Civil Engineering (Construction Technology) (Self-Financed)'
);


-- ============================================================
-- FIRST AND LAST NAME POOLS
-- ============================================================

CREATE TEMP TABLE seed_first_names (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_first_names (id, name)
VALUES
(1,  'Aarav'),
(2,  'Aditi'),
(3,  'Aditya'),
(4,  'Aisha'),
(5,  'Akash'),
(6,  'Ananya'),
(7,  'Arjun'),
(8,  'Ayushi'),
(9,  'Dev'),
(10, 'Diya'),
(11, 'Farhan'),
(12, 'Fatima'),
(13, 'Harsh'),
(14, 'Ishita'),
(15, 'Kabir'),
(16, 'Kritika'),
(17, 'Mohammad'),
(18, 'Neha'),
(19, 'Rahul'),
(20, 'Sana'),
(21, 'Rohan'),
(22, 'Priya'),
(23, 'Sameer'),
(24, 'Simran'),
(25, 'Tanish'),
(26, 'Zoya'),
(27, 'Aryan'),
(28, 'Mehak'),
(29, 'Nikhil'),
(30, 'Riya');

CREATE TEMP TABLE seed_last_names (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_last_names (id, name)
VALUES
(1,  'Sharma'),
(2,  'Khan'),
(3,  'Verma'),
(4,  'Singh'),
(5,  'Gupta'),
(6,  'Ali'),
(7,  'Ansari'),
(8,  'Malik'),
(9,  'Yadav'),
(10, 'Jain'),
(11, 'Siddiqui'),
(12, 'Mehta'),
(13, 'Chauhan'),
(14, 'Qureshi'),
(15, 'Kapoor'),
(16, 'Raza'),
(17, 'Bhatia'),
(18, 'Ahmed'),
(19, 'Mishra'),
(20, 'Nair');


-- ============================================================
-- GENERATE STUDENT SEED DATA
-- ============================================================

CREATE TEMP TABLE generated_students
ON COMMIT DROP
AS
SELECT
    b.branch_code,
    b.department,
    b.branch,
    graduation_year,
    student_number,

    fn.name || ' ' || ln.name AS student_name,

    LOWER(
        b.branch_code
        || graduation_year::TEXT
        || LPAD(student_number::TEXT, 2, '0')
    ) AS roll_no,

    LOWER(
        b.branch_code
        || graduation_year::TEXT
        || LPAD(student_number::TEXT, 2, '0')
        || '@st.jmi.ac.in'
    ) AS email,

    '+91'
    || (
        7000000000::BIGINT
        + (
            ROW_NUMBER() OVER (
                ORDER BY b.branch_code, graduation_year, student_number
            )
        )
    )::TEXT AS phone,

    CASE
        WHEN student_number % 2 = 0 THEN 'Female'
        ELSE 'Male'
    END AS gender,

    CASE student_number % 5
        WHEN 0 THEN 'Delhi'
        WHEN 1 THEN 'Uttar Pradesh'
        WHEN 2 THEN 'Bihar'
        WHEN 3 THEN 'Haryana'
        ELSE 'Rajasthan'
    END AS region,

    CASE student_number % 5
        WHEN 0 THEN 'Islam'
        WHEN 1 THEN 'Hinduism'
        WHEN 2 THEN 'Hinduism'
        WHEN 3 THEN 'Islam'
        ELSE 'Sikhism'
    END AS religion,

    (
        DATE '2003-01-01'
        + (
            (
                student_number * 73
                + graduation_year
                + LENGTH(b.branch_code) * 17
            ) % 1000
        )::INT
    ) AS date_of_birth,

    -- CGPA distribution:
    -- 10% below 6
    -- 20% 6.0 - 6.9
    -- 25% 7.0 - 7.9
    -- 25% 8.0 - 8.9
    -- 20% 9.0+
    CASE student_number
        WHEN 1  THEN 5.42
        WHEN 2  THEN 5.81
        WHEN 3  THEN 6.12
        WHEN 4  THEN 6.38
        WHEN 5  THEN 6.61
        WHEN 6  THEN 6.89
        WHEN 7  THEN 7.04
        WHEN 8  THEN 7.22
        WHEN 9  THEN 7.41
        WHEN 10 THEN 7.63
        WHEN 11 THEN 7.86
        WHEN 12 THEN 8.03
        WHEN 13 THEN 8.21
        WHEN 14 THEN 8.44
        WHEN 15 THEN 8.67
        WHEN 16 THEN 8.88
        WHEN 17 THEN 9.02
        WHEN 18 THEN 9.21
        WHEN 19 THEN 9.48
        WHEN 20 THEN 9.76
    END::NUMERIC(4,2) AS cgpa,

    CASE
        WHEN student_number IN (1, 4, 9) THEN 2
        WHEN student_number IN (2, 6, 13, 18) THEN 1
        ELSE 0
    END AS active_backlogs,

    CASE
        WHEN student_number IN (1, 3) THEN 4
        WHEN student_number IN (5, 8, 12) THEN 3
        WHEN student_number IN (2, 6, 10, 15) THEN 2
        WHEN student_number IN (4, 7, 11, 17) THEN 1
        ELSE 0
    END AS passive_backlogs,

    CASE student_number
        WHEN 1  THEN 58.40
        WHEN 2  THEN 61.20
        WHEN 3  THEN 64.80
        WHEN 4  THEN 67.30
        WHEN 5  THEN 69.90
        WHEN 6  THEN 71.40
        WHEN 7  THEN 73.20
        WHEN 8  THEN 75.60
        WHEN 9  THEN 77.10
        WHEN 10 THEN 79.80
        WHEN 11 THEN 81.20
        WHEN 12 THEN 83.50
        WHEN 13 THEN 85.40
        WHEN 14 THEN 87.60
        WHEN 15 THEN 89.20
        WHEN 16 THEN 91.30
        WHEN 17 THEN 92.80
        WHEN 18 THEN 94.10
        WHEN 19 THEN 95.60
        WHEN 20 THEN 97.20
    END::NUMERIC(5,2) AS tenth_percentage,

    CASE student_number
        WHEN 1  THEN 55.20
        WHEN 2  THEN 59.80
        WHEN 3  THEN 62.40
        WHEN 4  THEN 65.10
        WHEN 5  THEN 68.70
        WHEN 6  THEN 70.30
        WHEN 7  THEN 72.80
        WHEN 8  THEN 74.20
        WHEN 9  THEN 76.90
        WHEN 10 THEN 78.40
        WHEN 11 THEN 80.10
        WHEN 12 THEN 82.60
        WHEN 13 THEN 84.30
        WHEN 14 THEN 86.70
        WHEN 15 THEN 88.10
        WHEN 16 THEN 90.40
        WHEN 17 THEN 92.20
        WHEN 18 THEN 93.80
        WHEN 19 THEN 95.10
        WHEN 20 THEN 96.70
    END::NUMERIC(5,2) AS twelfth_percentage,

    CASE
        WHEN graduation_year = 2027 THEN 7
        ELSE 5
    END AS semester

FROM seed_branches b
CROSS JOIN (
    VALUES (2027), (2028)
) AS years(graduation_year)
CROSS JOIN generate_series(1, 20) AS student_number
JOIN seed_first_names fn
    ON fn.id = (
        (
            student_number
            + graduation_year
            + LENGTH(b.branch_code)
        ) % 30
    ) + 1
JOIN seed_last_names ln
    ON ln.id = (
        (
            student_number * 3
            + graduation_year
            + LENGTH(b.branch)
        ) % 20
    ) + 1;


-- ============================================================
-- CREATE STUDENT USERS
-- ============================================================

INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    is_verified,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    gs.email,
    'CHANGE_ME',
    'student',
    TRUE,
    NOW(),
    NOW()
FROM generated_students gs
ON CONFLICT (email)
DO UPDATE SET
    role = EXCLUDED.role,
    is_verified = TRUE,
    updated_at = NOW();


-- ============================================================
-- CREATE STUDENT RECORDS
-- ============================================================

INSERT INTO students (
    roll_no,
    name,
    email,
    phone,
    branch,
    graduation_year,
    cgpa,
    placement_status,
    created_at,
    gender,
    region,
    religion,
    date_of_birth,
    active_backlogs,
    passive_backlogs,
    review_status,
    reviewed_at,
    user_id,
    department,
    tenth_percentage,
    twelfth_percentage,
    sem1_spi,
    sem2_spi,
    sem3_spi,
    sem4_spi,
    sem5_spi,
    sem6_spi,
    sem7_spi,
    sem8_spi,
    semester,
    rejection_reason,
    assigned_spc_id,
    resume_url,
    tenth_marksheet_url,
    twelfth_marksheet_url,
    last_sem_marksheet_url,
    is_profile_complete
)
SELECT
    gs.roll_no,
    gs.student_name,
    gs.email,
    gs.phone,
    gs.branch,
    gs.graduation_year,
    gs.cgpa,

    CASE
        WHEN gs.student_number IN (19, 20)
            AND gs.graduation_year = 2027
        THEN 'placed'
        ELSE 'unplaced'
    END,

    NOW(),
    gs.gender,
    gs.region,
    gs.religion,
    gs.date_of_birth,
    gs.active_backlogs,
    gs.passive_backlogs,

    CASE
        WHEN gs.student_number IN (3, 11) THEN 'pending'
        WHEN gs.student_number = 1 THEN 'rejected'
        ELSE 'approved'
    END,

    CASE
        WHEN gs.student_number IN (3, 11)
        THEN NULL
        ELSE NOW()
    END,

    u.id,
    gs.department,
    gs.tenth_percentage,
    gs.twelfth_percentage,

    ROUND(
        GREATEST(4.00, LEAST(10.00, gs.cgpa - 0.45))::NUMERIC,
        2
    ),

    ROUND(
        GREATEST(4.00, LEAST(10.00, gs.cgpa - 0.30))::NUMERIC,
        2
    ),

    ROUND(
        GREATEST(4.00, LEAST(10.00, gs.cgpa - 0.15))::NUMERIC,
        2
    ),

    ROUND(
        GREATEST(4.00, LEAST(10.00, gs.cgpa))::NUMERIC,
        2
    ),

    ROUND(
        GREATEST(4.00, LEAST(10.00, gs.cgpa + 0.10))::NUMERIC,
        2
    ),

    CASE
        WHEN gs.graduation_year = 2027
        THEN ROUND(
            GREATEST(
                4.00,
                LEAST(10.00, gs.cgpa + 0.20)
            )::NUMERIC,
            2
        )
        ELSE NULL
    END,

    CASE
        WHEN gs.graduation_year = 2027
        THEN ROUND(
            GREATEST(
                4.00,
                LEAST(10.00, gs.cgpa + 0.25)
            )::NUMERIC,
            2
        )
        ELSE NULL
    END,

    NULL,

    gs.semester,

    CASE
        WHEN gs.student_number = 1
        THEN 'Academic details require correction'
        ELSE NULL
    END,

    NULL,

    CASE
        WHEN gs.student_number IN (3, 11)
        THEN NULL
        ELSE
            'https://example.com/documents/'
            || gs.roll_no
            || '_resume.pdf'
    END,

    CASE
        WHEN gs.student_number IN (3, 11)
        THEN NULL
        ELSE
            'https://example.com/documents/'
            || gs.roll_no
            || '_10th.pdf'
    END,

    CASE
        WHEN gs.student_number IN (3, 11)
        THEN NULL
        ELSE
            'https://example.com/documents/'
            || gs.roll_no
            || '_12th.pdf'
    END,

    CASE
        WHEN gs.student_number IN (3, 11)
        THEN NULL
        ELSE
            'https://example.com/documents/'
            || gs.roll_no
            || '_latest_sem.pdf'
    END,

    CASE
        WHEN gs.student_number IN (3, 11)
        THEN FALSE
        ELSE TRUE
    END

FROM generated_students gs
JOIN users u
    ON u.email = gs.email

ON CONFLICT (roll_no)
DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    branch = EXCLUDED.branch,
    graduation_year = EXCLUDED.graduation_year,
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    gender = EXCLUDED.gender,
    region = EXCLUDED.region,
    religion = EXCLUDED.religion,
    date_of_birth = EXCLUDED.date_of_birth,
    active_backlogs = EXCLUDED.active_backlogs,
    passive_backlogs = EXCLUDED.passive_backlogs,
    review_status = EXCLUDED.review_status,
    reviewed_at = EXCLUDED.reviewed_at,
    user_id = EXCLUDED.user_id,
    department = EXCLUDED.department,
    tenth_percentage = EXCLUDED.tenth_percentage,
    twelfth_percentage = EXCLUDED.twelfth_percentage,
    sem1_spi = EXCLUDED.sem1_spi,
    sem2_spi = EXCLUDED.sem2_spi,
    sem3_spi = EXCLUDED.sem3_spi,
    sem4_spi = EXCLUDED.sem4_spi,
    sem5_spi = EXCLUDED.sem5_spi,
    sem6_spi = EXCLUDED.sem6_spi,
    sem7_spi = EXCLUDED.sem7_spi,
    sem8_spi = EXCLUDED.sem8_spi,
    semester = EXCLUDED.semester,
    rejection_reason = EXCLUDED.rejection_reason,
    resume_url = EXCLUDED.resume_url,
    tenth_marksheet_url = EXCLUDED.tenth_marksheet_url,
    twelfth_marksheet_url = EXCLUDED.twelfth_marksheet_url,
    last_sem_marksheet_url = EXCLUDED.last_sem_marksheet_url,
    is_profile_complete = EXCLUDED.is_profile_complete;


-- ============================================================
-- GENERATE TPC DATA
-- ============================================================

CREATE TEMP TABLE generated_tpcs
ON COMMIT DROP
AS
SELECT
    b.branch_code,
    b.department,
    b.branch,

    'TPC ' || b.branch_code AS tpc_name,

    LOWER(
        'tpc.'
        || b.branch_code
        || '@jmi.ac.in'
    ) AS email,

    '+91'
    || (
        8800000000::BIGINT
        + ROW_NUMBER() OVER (
            ORDER BY b.branch_code
        )
    )::TEXT AS phone

FROM seed_branches b;


-- ============================================================
-- CREATE TPC USERS
-- ============================================================

INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    is_verified,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    gt.email,
    'CHANGE_ME',
    'tpc',
    TRUE,
    NOW(),
    NOW()
FROM generated_tpcs gt
ON CONFLICT (email)
DO UPDATE SET
    role = EXCLUDED.role,
    is_verified = TRUE,
    updated_at = NOW();


-- ============================================================
-- CREATE TPC RECORDS
-- ============================================================

INSERT INTO tpc (
    user_id,
    name,
    email,
    phone,
    branch,
    created_at,
    department
)
SELECT
    u.id,
    gt.tpc_name,
    gt.email,
    gt.phone,
    gt.branch,
    NOW(),
    gt.department

FROM generated_tpcs gt
JOIN users u
    ON u.email = gt.email

ON CONFLICT (email)
DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    branch = EXCLUDED.branch,
    department = EXCLUDED.department;


COMMIT;


-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Expected: 20 students for every branch/year combination.
SELECT
    department,
    branch,
    graduation_year,
    COUNT(*) AS student_count
FROM students
WHERE graduation_year IN (2027, 2028)
GROUP BY
    department,
    branch,
    graduation_year
ORDER BY
    department,
    branch,
    graduation_year;


-- Expected: 400 generated students.
SELECT COUNT(*) AS total_seed_students
FROM students
WHERE graduation_year IN (2027, 2028)
  AND email LIKE '%@st.jmi.ac.in';


-- CGPA distribution.
SELECT
    CASE
        WHEN cgpa < 6 THEN 'Below 6'
        WHEN cgpa < 7 THEN '6 - 6.99'
        WHEN cgpa < 8 THEN '7 - 7.99'
        WHEN cgpa < 9 THEN '8 - 8.99'
        ELSE '9+'
    END AS cgpa_band,
    COUNT(*) AS student_count
FROM students
WHERE graduation_year IN (2027, 2028)
GROUP BY 1
ORDER BY 1;


-- Backlog distribution.
SELECT
    active_backlogs,
    passive_backlogs,
    COUNT(*) AS student_count
FROM students
WHERE graduation_year IN (2027, 2028)
GROUP BY
    active_backlogs,
    passive_backlogs
ORDER BY
    active_backlogs,
    passive_backlogs;


-- Expected: one TPC per branch.
SELECT
    department,
    branch,
    COUNT(*) AS tpc_count
FROM tpc
GROUP BY
    department,
    branch
ORDER BY
    department,
    branch;
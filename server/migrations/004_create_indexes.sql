CREATE INDEX idx_students_branch
ON students(branch);

CREATE INDEX idx_students_cgpa
ON students(cgpa);

CREATE INDEX idx_companies_drive_date
ON companies(drive_date);

CREATE INDEX idx_applications_student
ON applications(student_id);

CREATE INDEX idx_applications_company
ON applications(company_id);

CREATE UNIQUE INDEX idx_unique_application
ON applications(student_id, company_id);
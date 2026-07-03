-- Verification workflow support on students:
--   rejection_reason  - message recorded when an SPC or TPC rejects the profile
--   semester          - the student's current semester (placement students are
--                       in 5-8); also drives which per-semester SPIs are required
--   assigned_spc_id    - which SPC is responsible for verifying this student.
--                       Set by the TPC's "Assign students to SPC" action; the
--                       SPC verification queue is filtered on it. ON DELETE SET
--                       NULL so demoting an SPC (which removes their spc row)
--                       auto-clears their assignments.
ALTER TABLE students ADD COLUMN rejection_reason TEXT;

ALTER TABLE students ADD COLUMN semester INT CHECK (semester BETWEEN 5 AND 8);

ALTER TABLE students ADD COLUMN assigned_spc_id INT REFERENCES spc(spc_id) ON DELETE SET NULL;

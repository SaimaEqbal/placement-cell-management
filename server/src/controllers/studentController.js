import pool from "../config/db.js";
import { pgErrorResponse } from "../lib/dbError.js";
import { computeCgpaRounded } from "../lib/cgpa.js";

const spiArrayOf = (src) => [
  src.sem1_spi, src.sem2_spi, src.sem3_spi, src.sem4_spi,
  src.sem5_spi, src.sem6_spi, src.sem7_spi, src.sem8_spi,
];

export const createStudent = async (req, res) => {

  try {

    const {
      roll_no,
      name,
      email,
      phone,
      branch,
      department,
      batch,

      gender,
      region,
      religion,
      date_of_birth,

      active_backlogs,
      passive_backlogs,

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

      resume_url,
      tenth_marksheet_url,
      twelfth_marksheet_url,
      last_sem_marksheet_url,

      placement_status,
      semester,
    } = req.body;

    const userId = req.user.userId;

    // CGPA is derived server-side from the SPIs, never taken from the client.
    const cgpa = computeCgpaRounded(spiArrayOf(req.body), semester);

    const result = await pool.query(
  `INSERT INTO students (
      roll_no,
      name,
      email,
      phone,
      branch,
      department,
      batch,
      cgpa,
      gender,
      region,
      religion,
      date_of_birth,
      active_backlogs,
      passive_backlogs,
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
      resume_url,
      tenth_marksheet_url,
      twelfth_marksheet_url,
      last_sem_marksheet_url,
      placement_status,
      semester,
      user_id
  )
  VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,
      $15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,
      $27,$28,$29,$30,$31
  )
  RETURNING *`,
  [
    roll_no,
    name,
    email,
    phone,
    branch,
    department,
    batch,
    cgpa,
    gender,
    region,
    religion,
    date_of_birth,
    active_backlogs,
    passive_backlogs,
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
    resume_url,
    tenth_marksheet_url,
    twelfth_marksheet_url,
    last_sem_marksheet_url,
    placement_status,
    semester,
    userId
  ]
);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.log(error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: uniqueViolationMessage(error.constraint)
      });
    }

    const { status, message } = pgErrorResponse(error, "Failed to create student");
    return res.status(status).json({ message });
  }
};

// Purpose: map a Postgres unique-constraint name to a human-readable, UI-safe
// message so duplicate roll_no / email / profile errors are actionable.
const uniqueViolationMessage = (constraint) => {
  if (constraint === "students_roll_no_key") {
    return "A student with this roll number already exists.";
  }
  if (constraint === "students_email_key") {
    return "A student with this email already exists.";
  }
  if (constraint === "students_user_id_key") {
    return "A profile already exists for this account.";
  }
  return "That record conflicts with an existing one.";
};

export const getStudents = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students ORDER BY id"
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch students"
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      roll_no,
      name,
      email,
      phone,
      branch,
      department,
      batch,

      gender,
      region,
      religion,
      date_of_birth,

      active_backlogs,
      passive_backlogs,

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

      resume_url,
      tenth_marksheet_url,
      twelfth_marksheet_url,
      last_sem_marksheet_url,

      placement_status,
      semester,
    } = req.body;

    // Fetch current student
    const existingStudent = await pool.query(
      `SELECT *
       FROM students
       WHERE id = $1`,
      [id]
    );

    if (existingStudent.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const student = existingStudent.rows[0];

    // Fields that DO NOT require re-verification
    const ignoredFields = [
      "roll_no",
      "name",
      "email",
      "phone",
      "gender",
      "region",
      "religion",
      "date_of_birth",
      "resume_url",
    ];

    // Compare every field being updated
    let requiresReview = false;

    for (const key of Object.keys(req.body)) {
      if (!ignoredFields.includes(key) && student[key] != req.body[key]) {
        requiresReview = true;
        break;
      }
    }

    const reviewStatus = requiresReview
      ? "pending"
      : student.review_status;

    const reviewedAt = requiresReview
      ? null
      : student.reviewed_at;

    // CGPA is derived server-side from the SPIs, never taken from the client.
    const cgpa = computeCgpaRounded(spiArrayOf(req.body), semester);

    const result = await pool.query(
      `UPDATE students
       SET roll_no = $1,
           name = $2,
           email = $3,
           phone = $4,
           branch = $5,
           department = $6,
           batch = $7,
           cgpa = $8,
           gender = $9,
           region = $10,
           religion = $11,
           date_of_birth = $12,
           active_backlogs = $13,
           passive_backlogs = $14,
           tenth_percentage = $15,
           twelfth_percentage = $16,
           sem1_spi = $17,
           sem2_spi = $18,
           sem3_spi = $19,
           sem4_spi = $20,
           sem5_spi = $21,
           sem6_spi = $22,
           sem7_spi = $23,
           sem8_spi = $24,
           resume_url = $25,
           tenth_marksheet_url = $26,
           twelfth_marksheet_url = $27,
           last_sem_marksheet_url = $28,
           placement_status = $29,
           review_status = $30,
           reviewed_at = $31,
           semester = $32
       WHERE id = $33
       RETURNING *`,
      [
        roll_no,
        name,
        email,
        phone,
        branch,
        department,
        batch,
        cgpa,
        gender,
        region,
        religion,
        date_of_birth,
        active_backlogs,
        passive_backlogs,
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
        resume_url,
        tenth_marksheet_url,
        twelfth_marksheet_url,
        last_sem_marksheet_url,
        placement_status,
        reviewStatus,
        reviewedAt,
        semester,
        id,
      ]
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: uniqueViolationMessage(error.constraint),
      });
    }

    const { status, message } = pgErrorResponse(error, "Failed to update student");
    return res.status(status).json({ message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM students WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    return res.status(200).json({
      message: "Student deleted successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to delete student"
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT st.*, (sp.spc_id IS NOT NULL) AS is_spc
       FROM students st
       LEFT JOIN spc sp ON sp.user_id = st.user_id
       WHERE st.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch student"
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT s.*
       FROM students s
       WHERE s.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json(
      result.rows[0]
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

// Columns the self-service profile wizard may write. SQL identifiers are only
// ever taken from THIS allowlist - never from req.body keys - so a partial
// UPDATE can't be used to inject column names. `cgpa` is intentionally absent
// (derived server-side); the four document URLs are saved by the Documents step.
const MY_PROFILE_COLUMNS = [
  "roll_no", "name", "email", "phone",
  "branch", "department", "batch", "semester",
  "gender", "region", "religion", "date_of_birth",
  "active_backlogs", "passive_backlogs",
  "tenth_percentage", "twelfth_percentage",
  "sem1_spi", "sem2_spi", "sem3_spi", "sem4_spi",
  "sem5_spi", "sem6_spi", "sem7_spi", "sem8_spi",
  "resume_url", "tenth_marksheet_url", "twelfth_marksheet_url", "last_sem_marksheet_url",
  "payment_receipt_url", "payment_id",
  "placement_status",
];

// Personal-info fields whose change does NOT require re-verification (mirrors
// updateStudent's ignoredFields).
const REVIEW_IGNORED_FIELDS = [
  "roll_no", "name", "email", "phone",
  "gender", "region", "religion", "date_of_birth",
];

/**
 * Purpose: PUT /students/me - the self-scoped, PARTIAL upsert behind the 4-part
 * profile wizard. Each wizard step sends only its own fields; only those columns
 * are written (others are preserved). Resolves the row by the authenticated user,
 * derives CGPA server-side whenever SPIs/semester are touched, and re-flags review
 * when an academic/course field changes. Creates the row on first save.
 */
export const upsertMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Only allowlisted columns present in the validated body are considered.
    const provided = MY_PROFILE_COLUMNS.filter((col) =>
      Object.prototype.hasOwnProperty.call(req.body, col)
    );

    const existing = await pool.query(
      `SELECT * FROM students WHERE user_id = $1`,
      [userId]
    );
    const current = existing.rows[0] ?? null;

    // Derive CGPA from the merged (existing + incoming) SPIs + semester whenever
    // the save touches any SPI or the semester.
    const touchesCgpa =
      provided.includes("semester") ||
      provided.some((c) => /^sem[1-8]_spi$/.test(c));

    const merged = { ...(current ?? {}), ...req.body };

    let derivedCgpa;
    if (touchesCgpa) {
      derivedCgpa = computeCgpaRounded(spiArrayOf(merged), merged.semester);
    }

    // SPI completeness is verified here (not at the schema level) because the
    // wizard saves the semester (Course step) and the SPIs (Academic step) in
    // separate requests. Only enforce when this save actually submits SPIs, and
    // check against the merged/stored semester: a semester-n student must have
    // an SPI for every completed semester (1 .. n-1).
    const submitsSpis = provided.some((c) => /^sem[1-8]_spi$/.test(c));
    if (submitsSpis && merged.semester != null) {
      const missing = [];
      for (let i = 1; i < merged.semester; i++) {
        if (merged[`sem${i}_spi`] == null) {
          missing.push({
            path: [`sem${i}_spi`],
            message: `Semester ${i} SPI is required for a semester ${merged.semester} student.`,
          });
        }
      }
      if (missing.length > 0) {
        return res.status(400).json({ success: false, errors: missing });
      }
    }

    if (!current) {
      // First save: INSERT the provided columns + user_id (+ derived cgpa).
      const cols = [...provided];
      const values = provided.map((col) => req.body[col]);
      if (touchesCgpa) {
        cols.push("cgpa");
        values.push(derivedCgpa);
      }
      cols.push("user_id");
      values.push(userId);

      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      const colList = cols.map((c) => `"${c}"`).join(", ");

      const inserted = await pool.query(
        `INSERT INTO students (${colList}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return res.status(201).json(inserted.rows[0]);
    }

    if (provided.length === 0 && !touchesCgpa) {
      return res.status(400).json({ message: "No profile fields provided." });
    }

    // Re-verification: pending if any provided non-ignored field actually changed.
    const requiresReview = provided.some(
      (col) => !REVIEW_IGNORED_FIELDS.includes(col) && current[col] != req.body[col]
    );

    // Build the SET clause from the allowlist only.
    const setCols = [...provided];
    const setValues = provided.map((col) => req.body[col]);
    if (touchesCgpa) {
      setCols.push("cgpa");
      setValues.push(derivedCgpa);
    }
    if (requiresReview) {
      setCols.push("review_status");
      setValues.push("pending");
      setCols.push("reviewed_at");
      setValues.push(null);
    }

    const setClause = setCols
      .map((col, i) => `"${col}" = $${i + 1}`)
      .join(", ");
    setValues.push(userId);

    const updated = await pool.query(
      `UPDATE students SET ${setClause} WHERE user_id = $${setValues.length} RETURNING *`,
      setValues
    );

    return res.status(200).json(updated.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({ message: uniqueViolationMessage(error.constraint) });
    }
    const { status, message } = pgErrorResponse(error, "Failed to save profile");
    return res.status(status).json({ message });
  }
};
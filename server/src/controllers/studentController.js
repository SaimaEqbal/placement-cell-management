import pool from "../config/db.js";
import { pgErrorResponse } from "../lib/dbError.js";

export const createStudent = async (req, res) => {

  try {

    const {
      roll_no,
      name,
      email,
      phone,
      branch,
      department,
      graduation_year,
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
    } = req.body;

    const userId = req.user.userId;

    const result = await pool.query(
  `INSERT INTO students (
      roll_no,
      name,
      email,
      phone,
      branch,
      department,
      graduation_year,
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
      user_id
  )
  VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,
      $15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,
      $27,$28,$29,$30
  )
  RETURNING *`,
  [
    roll_no,
    name,
    email,
    phone,
    branch,
    department,
    graduation_year,
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
      graduation_year,
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

    const result = await pool.query(
      `UPDATE students
       SET roll_no = $1,
           name = $2,
           email = $3,
           phone = $4,
           branch = $5,
           department = $6,
           graduation_year = $7,
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
           reviewed_at = $31
       WHERE id = $32
       RETURNING *`,
      [
        roll_no,
        name,
        email,
        phone,
        branch,
        department,
        graduation_year,
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
      "SELECT * FROM students WHERE id = $1",
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
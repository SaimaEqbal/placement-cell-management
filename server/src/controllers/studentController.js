import pool from "../config/db.js";

export const createStudent = async (req, res) => {
  try {
    const {
      roll_no,
      name,
      email,
      phone,
      branch,
      graduation_year,
      cgpa,
      gender,
      region,
      religion,
      date_of_birth,
      active_backlogs,
      passive_backlogs,
      resume_url,
      tenth_marksheet_url,
      twelfth_marksheet_url,
      last_sem_marksheet_url,
      placement_status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO students (
        roll_no,
        name,
        email,
        phone,
        branch,
        graduation_year,
        cgpa,
        gender,
        region,
        religion,
        date_of_birth,
        active_backlogs,
        passive_backlogs,
        resume_url,
        tenth_marksheet_url,
        twelfth_marksheet_url,
        last_sem_marksheet_url,
        placement_status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *`,
      [
        roll_no,
        name,
        email,
        phone,
        branch,
        graduation_year,
        cgpa,
        gender,
        region,
        religion,
        date_of_birth,
        active_backlogs,
        passive_backlogs,
        resume_url,
        tenth_marksheet_url,
        twelfth_marksheet_url,
        last_sem_marksheet_url,
        placement_status
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create student"
    });
  }
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
      graduation_year,
      cgpa,
      gender,
      region,
      religion,
      date_of_birth,
      active_backlogs,
      passive_backlogs,
      resume_url,
      tenth_marksheet_url,
      twelfth_marksheet_url,
      last_sem_marksheet_url,
      placement_status
    } = req.body;

    const result = await pool.query(
      `UPDATE students
       SET roll_no = $1,
           name = $2,
           email = $3,
           phone = $4,
           branch = $5,
           graduation_year = $6,
           cgpa = $7,
           gender = $8,
           region = $9,
           religion = $10,
           date_of_birth = $11,
           active_backlogs = $12,
           passive_backlogs = $13,
           resume_url = $14,
           tenth_marksheet_url = $15,
           twelfth_marksheet_url = $16,
           last_sem_marksheet_url = $17,
           placement_status = $18
       WHERE id = $19
       RETURNING *`,
      [
        roll_no,
        name,
        email,
        phone,
        branch,
        graduation_year,
        cgpa,
        gender,
        region,
        religion,
        date_of_birth,
        active_backlogs,
        passive_backlogs,
        resume_url,
        tenth_marksheet_url,
        twelfth_marksheet_url,
        last_sem_marksheet_url,
        placement_status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update student"
    });
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
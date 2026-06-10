import pool from "../config/db.js";

export const getStudents = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students ORDER BY id"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch students"
    });
  }
};

export const createStudent = async (req, res) => {
  try {
    const {
      roll_no,
      name,
      email,
      phone,
      branch,
      graduation_year,
      cgpa
    } = req.body;

    const result = await pool.query(
      `INSERT INTO students
      (roll_no, name, email, phone, branch, graduation_year, cgpa)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        roll_no,
        name,
        email,
        phone,
        branch,
        graduation_year,
        cgpa
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create student"
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
           placement_status = $8
       WHERE id = $9
       RETURNING *`,
      [
        roll_no,
        name,
        email,
        phone,
        branch,
        graduation_year,
        cgpa,
        placement_status,
        id
      ]
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

    res.status(200).json({
      message: "Student deleted successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete student"
    });
  }
};
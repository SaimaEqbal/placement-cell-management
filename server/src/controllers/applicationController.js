import pool from "../config/db.js";

export const getApplications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.student_id,
        a.company_id,
        a.status,
        a.applied_at,
        s.name AS student_name,
        c.name AS company_name
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN companies c ON a.company_id = c.id
      ORDER BY a.id
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch applications",
    });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.student_id,
        a.company_id,
        a.status,
        a.applied_at,
        s.name AS student_name,
        c.name AS company_name
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN companies c ON a.company_id = c.id
      WHERE a.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch application",
    });
  }
};

export const createApplication = async (req, res) => {
  try {
    const { student_id, company_id } = req.body;

    const result = await pool.query(
      `
      INSERT INTO applications
      (student_id, company_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [student_id, company_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create application",
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE applications
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update application",
    });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM applications
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.status(200).json({
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete application",
    });
  }
};
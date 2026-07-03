import pool from "../config/db.js";
import { pgErrorResponse } from "../lib/dbError.js";

export const applyForDrive = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { student_id } = req.body;

    const existing = await pool.query(
      `SELECT *
       FROM applications
       WHERE student_id = $1
       AND drive_id = $2`,
      [student_id, driveId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Already applied",
      });
    }

    const result = await pool.query(
      `INSERT INTO applications (
          student_id,
          drive_id
       )
       VALUES ($1, $2)
       RETURNING *`,
      [student_id, driveId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to apply");
    return res.status(status).json({ message });
  }
};

export const withdrawApplication = async (
  req,
  res
) => {
  try {
    const { applicationId } = req.params;

    const applicationResult = await pool.query(
      `SELECT
          a.application_id,
          d.application_deadline
       FROM applications a
       JOIN drives d
       ON a.drive_id = d.drive_id
       WHERE a.application_id = $1`,
      [applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const deadline =
      applicationResult.rows[0]
        .application_deadline;

    if (new Date() > new Date(deadline)) {
      return res.status(400).json({
        message:
          "Application deadline has passed. Withdrawal is not allowed.",
      });
    }

    await pool.query(
      `DELETE FROM applications
       WHERE application_id = $1`,
      [applicationId]
    );

    return res.status(200).json({
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to withdraw application",
    });
  }
};

export const getMyApplications = async (
  req,
  res
) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM applications
       WHERE student_id = $1
       ORDER BY applied_at DESC`,
      [studentId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    const { status, message } = pgErrorResponse(error, "Failed to fetch applications");
    return res.status(status).json({ message });
  }
};
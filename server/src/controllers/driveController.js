import pool from "../config/db.js";
import {
  createNotification,
  createNotificationForRole,
} from "./notificationController.js";

// Purpose: look up which user (users.id) owns a given application, plus the
// job role and company name, so the notify* helpers below can message the
// right student with useful context. Failures here are swallowed by the
// callers - a notification hiccup should never break the underlying
// approve/reject/select/round action.
async function getApplicationContext(applicationId) {
  const result = await pool.query(
    `SELECT
        s.user_id,
        d.job_role,
        c.company_name
     FROM applications a
     JOIN students s ON a.student_id = s.id
     JOIN drives d ON a.drive_id = d.drive_id
     JOIN companies c ON d.company_id = c.company_id
     WHERE a.application_id = $1`,
    [applicationId]
  );

  return result.rows[0] ?? null;
}

/** Purpose: notify the student tied to an application about a status/round change. Never throws - a failed notification must not fail the underlying action. */
async function notifyApplicationEvent(applicationId, buildMessage) {
  try {
    const context = await getApplicationContext(applicationId);
    if (!context) return;

    const { title, message, tone } = buildMessage(context);
    await createNotification(context.user_id, title, message, tone);
  } catch (error) {
    console.error("Failed to send application notification:", error);
  }
}

export const createDrive = async (req, res) => {
  try {
    const {
      company_id,
      job_role,
      job_description,
      package_ctc,
      employment_type,
      drive_date,
      application_deadline,
      minimum_cgpa,
      allowed_branches,
      max_active_backlogs,
      max_passive_backlogs,
      number_of_rounds,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO drives (
        company_id,
        job_role,
        job_description,
        package_ctc,
        employment_type,
        drive_date,
        application_deadline,
        minimum_cgpa,
        allowed_branches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *`,
      [
        company_id,
        job_role,
        job_description,
        package_ctc,
        employment_type,
        drive_date,
        application_deadline,
        minimum_cgpa,
        allowed_branches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        req.user.userId,
      ]
    );

    const drive = result.rows[0];

    try {
      const companyResult = await pool.query(
        `SELECT company_name FROM companies WHERE company_id = $1`,
        [company_id]
      );
      const companyName = companyResult.rows[0]?.company_name ?? "A company";

      await createNotificationForRole(
        "student",
        "New placement drive announced",
        `${companyName} is hiring for ${job_role}. Check the drive for eligibility and the application deadline.`,
        "green"
      );
    } catch (error) {
      console.error("Failed to broadcast drive notification:", error);
    }

    return res.status(201).json(drive);
  } catch {
    return res.status(500).json({ message: "Failed to create drive" });
  }
};

export const getDrives = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM drives ORDER BY drive_date DESC`
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Failed to fetch drives" });
  }
};

export const getDriveById = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT * FROM drives WHERE drive_id=$1`,
      [driveId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Drive not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Failed to fetch drive" });
  }
};

export const updateDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    const {
      company_id,
      job_role,
      job_description,
      package_ctc,
      employment_type,
      drive_date,
      application_deadline,
      minimum_cgpa,
      allowed_branches,
      max_active_backlogs,
      max_passive_backlogs,
      number_of_rounds,
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE drives
       SET company_id = $1,
           job_role = $2,
           job_description = $3,
           package_ctc = $4,
           employment_type = $5,
           drive_date = $6,
           application_deadline = $7,
           minimum_cgpa = $8,
           allowed_branches = $9,
           max_active_backlogs = $10,
           max_passive_backlogs = $11,
           number_of_rounds = $12,
           status = $13,
           updated_at = NOW()
       WHERE drive_id = $14
       RETURNING *`,
      [
        company_id,
        job_role,
        job_description,
        package_ctc,
        employment_type,
        drive_date,
        application_deadline,
        minimum_cgpa,
        allowed_branches,
        max_active_backlogs,
        max_passive_backlogs,
        number_of_rounds,
        status,
        driveId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Drive not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update drive",
    });
  }
};

export const deleteDrive = async (req, res) => {
  try {
    const { driveId } = req.params;

    await pool.query(
      `DELETE FROM drives WHERE drive_id=$1`,
      [driveId]
    );

    return res.status(200).json({
      message: "Drive deleted successfully",
    });
  } catch {
    return res.status(500).json({ message: "Failed to delete drive" });
  }
};

export const getAppliedStudents = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT
          a.*,
          s.name,
          s.email,
          s.roll_no,
          s.branch,
          s.cgpa
       FROM applications a
       JOIN students s
       ON a.student_id = s.id
       WHERE a.drive_id = $1`,
      [driveId]
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({
      message: "Failed to fetch applicants",
    });
  }
};

export const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(
      `UPDATE applications
       SET status='approved'
       WHERE application_id=$1
       RETURNING *`,
      [applicationId]
    );

    await notifyApplicationEvent(applicationId, ({ job_role, company_name }) => ({
      title: "Application approved",
      message: `Your application for ${job_role} at ${company_name} has moved forward to the next stage.`,
      tone: "green",
    }));

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({
      message: "Failed to approve application",
    });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(
      `UPDATE applications
       SET status='rejected'
       WHERE application_id=$1
       RETURNING *`,
      [applicationId]
    );

    await notifyApplicationEvent(applicationId, ({ job_role, company_name }) => ({
      title: "Application not selected",
      message: `Your application for ${job_role} at ${company_name} was not moved forward this time.`,
      tone: "red",
    }));

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({
      message: "Failed to reject application",
    });
  }
};

export const updateStudentRound = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { current_round } = req.body;

    const result = await pool.query(
      `UPDATE applications
       SET current_round=$1
       WHERE application_id=$2
       RETURNING *`,
      [current_round, applicationId]
    );

    await notifyApplicationEvent(applicationId, ({ job_role, company_name }) => ({
      title: "Interview round updated",
      message: `You've advanced to round ${current_round} for ${job_role} at ${company_name}.`,
      tone: "blue",
    }));

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({
      message: "Failed to update round",
    });
  }
};

export const markStudentSelected = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(
      `UPDATE applications
       SET status='selected'
       WHERE application_id=$1
       RETURNING *`,
      [applicationId]
    );

    await notifyApplicationEvent(applicationId, ({ job_role, company_name }) => ({
      title: "Congratulations - you're selected!",
      message: `You've been selected for ${job_role} at ${company_name}.`,
      tone: "green",
    }));

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({
      message: "Failed to mark selected",
    });
  }
};

export const markStudentRejected = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(
      `UPDATE applications
       SET status='not_selected'
       WHERE application_id=$1
       RETURNING *`,
      [applicationId]
    );

    await notifyApplicationEvent(applicationId, ({ job_role, company_name }) => ({
      title: "Application result",
      message: `You were not selected for ${job_role} at ${company_name} this time. Keep going!`,
      tone: "gray",
    }));

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({
      message: "Failed to mark rejected",
    });
  }
};

export const getDriveResults = async (req, res) => {
  try {
    const { driveId } = req.params;

    const result = await pool.query(
      `SELECT
          s.name,
          s.roll_no,
          s.branch,
          a.current_round,
          a.status
       FROM applications a
       JOIN students s
       ON a.student_id = s.id
       WHERE a.drive_id = $1
       ORDER BY s.name`,
      [driveId]
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({
      message: "Failed to fetch results",
    });
  }
};
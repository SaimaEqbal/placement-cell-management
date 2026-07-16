import pool from "../config/db.js";

/**
 * Purpose: the SPC-side verification endpoints. An SPC verifies the students the
 * TPC assigned to them (students.assigned_spc_id). The queue shows only the
 * still-pending assignments; verifying flips the row to 'spc_verified' (ready
 * for the TPC), rejecting flips it to 'spc_rejected' (which lands it in the
 * TPC's verification queue with the reason attached).
 */

// GET /spc - every SPC across all departments (Admin roster view), each joined
// to their own student row for roll number / semester / batch context.
export const getAllSpcs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.spc_id, s.name, s.email, s.phone, s.department, s.branch,
              s.created_at,
              st.roll_no, st.semester, st.batch
       FROM spc s
       LEFT JOIN students st ON st.user_id = s.user_id
       ORDER BY s.department, s.branch, s.spc_id`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch SPCs" });
  }
};

// Resolve the spc_id for the authenticated SPC user. Returns null if there is no
// spc row (shouldn't happen behind requireSPC, but guard anyway).
const getSpcId = async (userId) => {
  const r = await pool.query(
    "SELECT spc_id FROM spc WHERE user_id = $1",
    [userId]
  );
  return r.rows.length ? r.rows[0].spc_id : null;
};

// GET /spc/verification-queue
export const getSpcQueue = async (req, res) => {
  try {
    const spcId = await getSpcId(req.user.userId);
    if (!spcId) {
      return res.status(404).json({ message: "SPC profile not found" });
    }

    const result = await pool.query(
      `SELECT *
       FROM students
       WHERE assigned_spc_id = $1
         AND review_status = 'pending'
       ORDER BY roll_no`,
      [spcId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch verification queue" });
  }
};

// PUT /spc/verify/:studentId - guarded so an SPC can only act on students
// actually assigned to them.
export const spcVerifyStudent = async (req, res) => {
  try {
    const spcId = await getSpcId(req.user.userId);
    if (!spcId) {
      return res.status(404).json({ message: "SPC profile not found" });
    }

    const { studentId } = req.params;

    const result = await pool.query(
      `UPDATE students
       SET review_status = 'spc_verified',
           reviewed_at = NOW(),
           rejection_reason = NULL
       WHERE id = $1
         AND assigned_spc_id = $2
       RETURNING *`,
      [studentId, spcId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found or not assigned to you",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to verify student" });
  }
};

// PUT /spc/reject/:studentId - records the reason and routes the student to the
// TPC via review_status = 'spc_rejected'.
export const spcRejectStudent = async (req, res) => {
  try {
    const spcId = await getSpcId(req.user.userId);
    if (!spcId) {
      return res.status(404).json({ message: "SPC profile not found" });
    }

    const { studentId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "A rejection reason is required" });
    }

    const result = await pool.query(
      `UPDATE students
       SET review_status = 'spc_rejected',
           rejection_reason = $1,
           reviewed_at = NOW()
       WHERE id = $2
         AND assigned_spc_id = $3
       RETURNING *`,
      [reason.trim(), studentId, spcId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found or not assigned to you",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to reject student" });
  }
};

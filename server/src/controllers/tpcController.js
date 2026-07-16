import pool from "../config/db.js";

// Parse an optional `year` query param (student graduation year) into a positive
// integer, or null when absent/blank/invalid so the caller skips the filter.
function parseYear(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export const getAllTPCs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          tpc_id,
          user_id,
          name,
          email,
          phone,
          department,
          branch,
          created_at
       FROM tpc
       ORDER BY tpc_id`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch TPCs",
    });
  }
};

export const createTPC = async (req, res) => {
  try {
    const {
      user_id,
      name,
      email,
      phone,
      department,
      branch,
    } = req.body;

    const existingTPC = await pool.query(
      `SELECT tpc_id
       FROM tpc
       WHERE email = $1`,
      [email]
    );

    if (existingTPC.rows.length > 0) {
      return res.status(409).json({
        message: "TPC already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO tpc
      (
        user_id,
        name,
        email,
        phone,
        department,
        branch
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        user_id,
        name,
        email,
        phone,
        department,
        branch,
      ]
    );

    return res.status(201).json(
      result.rows[0]
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create TPC",
    });
  }
};

export const updateTPC = async (req, res) => {
  try {
    const { tpcId } = req.params;
    const { name, email, phone, department, branch } = req.body;

    const result = await pool.query(
      `UPDATE tpc
       SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         department = COALESCE($4, department),
         branch = COALESCE($5, branch)
       WHERE tpc_id = $6
       RETURNING
         tpc_id,
         user_id,
         name,
         email,
         phone,
         department,
         branch,
         created_at`,
      [name, email, phone, department, branch, tpcId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "TPC not found",
      });
    }

    return res.status(200).json({
      message: "TPC updated successfully",
      tpc: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update TPC",
    });
  }
};

export const deleteTPC = async (req, res) => {
  try {
    const { tpcId } = req.params;

    const result = await pool.query(
      `DELETE FROM tpc
       WHERE tpc_id = $1
       RETURNING *`,
      [tpcId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "TPC not found",
      });
    }

    return res.status(200).json({
      message: "TPC deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to delete TPC",
    });
  }
};


export const promoteSPC = async (req, res) => {
  const client = await pool.connect();

  try {
    const { studentId } = req.params;

    await client.query("BEGIN");

    const studentResult = await client.query(
      `SELECT user_id, name, email, phone, department, branch
       FROM students
       WHERE id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Student not found",
      });
    }

    const student = studentResult.rows[0];

    // The spc table requires department and phone (both NOT NULL), but the
    // students columns are nullable. Promoting a student whose profile lacks
    // either would fail as a generic 500; return a clear, actionable error
    // instead so the TPC knows the profile must be completed first.
    if (!student.department || !student.phone) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          "This student's profile is missing a department or phone number, both required to become an SPC. Ask them to complete their profile first.",
      });
    }

    await client.query(
      `UPDATE users
       SET role = 'spc'
       WHERE id = $1`,
      [student.user_id]
    );

    await client.query(
      `INSERT INTO spc
       (user_id, name, email, phone, department, branch)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        student.user_id,
        student.name,
        student.email,
        student.phone,
        student.department,
        student.branch,
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Student promoted to SPC successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    return res.status(500).json({
      message: "Failed to promote SPC",
    });
  } finally {
    client.release();
  }
};

export const demoteSPC = async (req, res) => {
  const client = await pool.connect();

  try {
    const { studentId } = req.params;

    await client.query("BEGIN");

    const studentResult = await client.query(
      `SELECT user_id
       FROM students
       WHERE id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Student not found",
      });
    }

    const userId = studentResult.rows[0].user_id;

    await client.query(
      `UPDATE users
       SET role = 'student'
       WHERE id = $1`,
      [userId]
    );

    await client.query(
      `DELETE FROM spc
       WHERE user_id = $1`,
      [userId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "SPC demoted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    return res.status(500).json({
      message: "Failed to demote SPC",
    });
  } finally {
    client.release();
  }
};

// ---- TPC verification pipeline -------------------------------------------
//
// A TPC oversees one department (tpc.department). These endpoints are all
// scoped to that department, resolved from the authenticated user.

// Resolve the department the authenticated TPC oversees (null if no tpc row).
const getTpcDepartment = async (userId) => {
  const r = await pool.query(
    "SELECT department FROM tpc WHERE user_id = $1",
    [userId]
  );
  return r.rows.length ? r.rows[0].department : null;
};

// GET /tpc/students?rollNo= - every student in the TPC's department (the roster
// used for promote/demote/delete), optionally filtered by roll number.
export const getTpcStudents = async (req, res) => {
  try {
    const dept = await getTpcDepartment(req.user.userId);
    if (!dept) {
      return res.status(404).json({ message: "TPC profile not found" });
    }

    const { rollNo, year } = req.query;
    const params = [dept];
    let sql = `SELECT st.*, (sp.spc_id IS NOT NULL) AS is_spc
               FROM students st
               LEFT JOIN spc sp ON sp.user_id = st.user_id
               WHERE st.department = $1`;
    if (rollNo) {
      params.push(`%${rollNo}%`);
      sql += ` AND st.roll_no ILIKE $${params.length}`;
    }
    const yr = parseYear(year);
    if (yr !== null) {
      params.push(yr);
      sql += ` AND st.batch = $${params.length}`;
    }
    sql += ` ORDER BY st.roll_no`;

    const result = await pool.query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch students" });
  }
};

// GET /tpc/verification-queue?branch= - students the SPC rejected, now awaiting
// TPC review, optionally filtered to one branch under the department.
export const getTpcQueue = async (req, res) => {
  try {
    const dept = await getTpcDepartment(req.user.userId);
    if (!dept) {
      return res.status(404).json({ message: "TPC profile not found" });
    }

    const { branch, year } = req.query;
    const params = [dept];
    let sql = `SELECT * FROM students
               WHERE department = $1 AND review_status = 'spc_rejected'`;
    if (branch) {
      params.push(branch);
      sql += ` AND branch = $${params.length}`;
    }
    const yr = parseYear(year);
    if (yr !== null) {
      params.push(yr);
      sql += ` AND batch = $${params.length}`;
    }
    sql += ` ORDER BY roll_no`;

    const result = await pool.query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch verification queue" });
  }
};

// GET /tpc/spc-verified?branch= - the TPC's final-review list: students an SPC
// verified, PLUS SPC coordinators' own profiles (which skip SPC review, since an
// SPC is verified only by the TPC). `is_spc` flags the latter for the UI.
export const getTpcSpcVerified = async (req, res) => {
  try {
    const dept = await getTpcDepartment(req.user.userId);
    if (!dept) {
      return res.status(404).json({ message: "TPC profile not found" });
    }

    const { branch, year } = req.query;
    const params = [dept];
    let sql = `SELECT st.*, (sp.spc_id IS NOT NULL) AS is_spc
               FROM students st
               LEFT JOIN spc sp ON sp.user_id = st.user_id
               WHERE st.department = $1
                 AND (
                   st.review_status = 'spc_verified'
                   OR (sp.spc_id IS NOT NULL AND st.review_status = 'pending')
                 )`;
    if (branch) {
      params.push(branch);
      sql += ` AND st.branch = $${params.length}`;
    }
    const yr = parseYear(year);
    if (yr !== null) {
      params.push(yr);
      sql += ` AND st.batch = $${params.length}`;
    }
    sql += ` ORDER BY st.roll_no`;

    const result = await pool.query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch SPC-verified students" });
  }
};

// GET /tpc/branches - distinct branches present in the TPC's department. There
// is no separate branches table, so we derive them from the students.
export const getTpcBranches = async (req, res) => {
  try {
    const dept = await getTpcDepartment(req.user.userId);
    if (!dept) {
      return res.status(404).json({ message: "TPC profile not found" });
    }

    const result = await pool.query(
      `SELECT DISTINCT branch
       FROM students
       WHERE department = $1 AND branch IS NOT NULL
       ORDER BY branch`,
      [dept]
    );
    return res.status(200).json(result.rows.map((r) => r.branch));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch branches" });
  }
};

// GET /tpc/spcs?branch= - the SPCs in the TPC's department + given branch,
// ordered by spc_id, with the roll number and semester from their student row.
export const getTpcSpcs = async (req, res) => {
  try {
    const dept = await getTpcDepartment(req.user.userId);
    if (!dept) {
      return res.status(404).json({ message: "TPC profile not found" });
    }

    const { branch, year } = req.query;
    if (!branch) {
      return res.status(400).json({ message: "branch is required" });
    }

    const params = [dept, branch];
    let sql = `SELECT s.spc_id, s.name, s.email, s.department, s.branch,
                      st.roll_no, st.semester, st.batch
               FROM spc s
               LEFT JOIN students st ON st.user_id = s.user_id
               WHERE s.department = $1 AND s.branch = $2`;
    const yr = parseYear(year);
    if (yr !== null) {
      params.push(yr);
      sql += ` AND st.batch = $${params.length}`;
    }
    sql += ` ORDER BY s.spc_id`;

    const result = await pool.query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch SPCs" });
  }
};

// POST /tpc/assign-spc  body { branch }
// Divide the students of each (branch, semester) cohort evenly among the SPCs of
// that same cohort - round-robin, ordered by spc_id - and record it on
// students.assigned_spc_id. SPC coordinators are NEVER assigned (they are
// verified directly by the TPC), so they are excluded from the candidate pool.
export const assignStudentsToSpc = async (req, res) => {
  const dept = await getTpcDepartment(req.user.userId);
  if (!dept) {
    return res.status(404).json({ message: "TPC profile not found" });
  }

  const { branch } = req.body;
  if (!branch) {
    return res.status(400).json({ message: "branch is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // SPCs in this dept+branch, with the semester from their own student row.
    const spcResult = await client.query(
      `SELECT s.spc_id, st.semester
       FROM spc s
       JOIN students st ON st.user_id = s.user_id
       WHERE s.department = $1 AND s.branch = $2
       ORDER BY s.spc_id`,
      [dept, branch]
    );

    // Group SPC ids by semester; SPCs with no semester set can't cohort.
    const spcsBySem = new Map();
    for (const row of spcResult.rows) {
      if (row.semester == null) continue;
      if (!spcsBySem.has(row.semester)) spcsBySem.set(row.semester, []);
      spcsBySem.get(row.semester).push(row.spc_id);
    }

    const perSpc = {};
    for (const row of spcResult.rows) perSpc[row.spc_id] = 0;

    for (const [semester, spcIds] of spcsBySem) {
      // Candidate students: same dept/branch/semester, complete profile, and not
      // themselves an SPC coordinator.
      const students = await client.query(
        `SELECT id
         FROM students
         WHERE department = $1
           AND branch = $2
           AND semester = $3
           AND is_profile_complete = TRUE
           AND user_id NOT IN (SELECT user_id FROM spc)
         ORDER BY id`,
        [dept, branch, semester]
      );

      for (let i = 0; i < students.rows.length; i++) {
        const spcId = spcIds[i % spcIds.length];
        await client.query(
          `UPDATE students SET assigned_spc_id = $1 WHERE id = $2`,
          [spcId, students.rows[i].id]
        );
        perSpc[spcId] = (perSpc[spcId] || 0) + 1;
      }
    }

    await client.query("COMMIT");

    const totalAssigned = Object.values(perSpc).reduce((a, b) => a + b, 0);
    return res.status(200).json({
      message: "Students assigned to SPCs for verification",
      totalAssigned,
      perSpc,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({ message: "Failed to assign students" });
  } finally {
    client.release();
  }
};

// PUT /tpc/verify/:studentId - final TPC approval (department-scoped).
export const tpcVerifyStudent = async (req, res) => {
  try {
    const dept = await getTpcDepartment(req.user.userId);
    if (!dept) {
      return res.status(404).json({ message: "TPC profile not found" });
    }

    const { studentId } = req.params;
    const result = await pool.query(
      `UPDATE students
       SET review_status = 'verified',
           reviewed_at = NOW(),
           rejection_reason = NULL
       WHERE id = $1 AND department = $2
       RETURNING *`,
      [studentId, dept]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found in your department" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to verify student" });
  }
};

// PUT /tpc/reject/:studentId  body { reason }
export const tpcRejectStudent = async (req, res) => {
  try {
    const dept = await getTpcDepartment(req.user.userId);
    if (!dept) {
      return res.status(404).json({ message: "TPC profile not found" });
    }

    const { studentId } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "A rejection reason is required" });
    }

    const result = await pool.query(
      `UPDATE students
       SET review_status = 'rejected',
           rejection_reason = $1,
           reviewed_at = NOW()
       WHERE id = $2 AND department = $3
       RETURNING *`,
      [reason.trim(), studentId, dept]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found in your department" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to reject student" });
  }
};
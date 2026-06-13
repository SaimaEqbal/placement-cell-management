import pool from "../config/db.js";

export const getAllTPCs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          tpc_id,
          user_id,
          name,
          email,
          phone,
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
        branch
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        user_id,
        name,
        email,
        phone,
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
    const { name, email, phone, branch } = req.body;

    

    const result = await pool.query(
      `UPDATE tpc
       SET
         name = $1,
         email = $2,
         phone = $3,
         branch = $4
       WHERE tpc_id = $5
       RETURNING
         tpc_id,
         user_id,
         name,
         email,
         phone,
         branch,
         created_at`,
      [name, email, phone, branch, tpcId]
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
      `SELECT user_id, name, email, phone, branch
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

    await client.query(
      `UPDATE users
       SET role = 'spc'
       WHERE id = $1`,
      [student.user_id]
    );

    await client.query(
      `INSERT INTO spc
       (user_id, name, email, phone, branch)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        student.user_id,
        student.name,
        student.email,
        student.phone,
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
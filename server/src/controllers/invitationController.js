import pool from "../config/db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

export const sendInvitation = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      `SELECT id, role
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      // Same role
      if (user.role === role) {
        return res.status(409).json({
          message: `User is already registered as ${role}.`,
        });
      }

      // Different role
      return res.status(409).json({
        message: `User already exists as ${user.role}. Use the role update feature instead.`,
        currentRole: user.role,
        requestedRole: role,
      });
    }

    // Prevent duplicate pending invitations
    const existingInvitation = await pool.query(
      `SELECT invitation_id
       FROM invitations
       WHERE email = $1
         AND accepted = FALSE
         AND expires_at > NOW()`,
      [email]
    );

    if (existingInvitation.rows.length > 0) {
      return res.status(409).json({
        message: "A pending invitation has already been sent to this email.",
      });
    }

    const token = crypto.randomUUID();

    await pool.query(
      `INSERT INTO invitations
      (
        email,
        role,
        token,
        expires_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        NOW() + INTERVAL '7 days'
      )`,
      [email, role, token]
    );

    const inviteLink = `http://localhost:5173/register/${token}`;

    // TODO: Send email containing inviteLink

    return res.status(201).json({
      message: "Invitation sent successfully.",
      inviteLink,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to send invitation.",
    });
  }
};


export const updateUserRole = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId } = req.params;
    const { role } = req.body;

    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT id, email, role
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    if (user.role === role) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: `User is already a ${role}.`,
      });
    }

    await client.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2`,
      [role, userId]
    );

    // If promoting to TPC, ensure a TPC profile exists
    if (role === "tpc") {
      const tpcResult = await client.query(
        `SELECT tpc_id
         FROM tpc
         WHERE user_id = $1`,
        [userId]
      );

      if (tpcResult.rows.length === 0) {
        await client.query(
          `INSERT INTO tpc
          (
            user_id,
            name,
            email
          )
          SELECT
            id,
            '',
            email
          FROM users
          WHERE id = $1`,
          [userId]
        );
      }
    }

    // If demoting from TPC, remove the TPC profile
    if (user.role === "tpc" && role !== "tpc") {
      await client.query(
        `DELETE FROM tpc
         WHERE user_id = $1`,
        [userId]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "User role updated successfully.",
      previousRole: user.role,
      newRole: role,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    return res.status(500).json({
      message: "Failed to update user role.",
    });
  } finally {
    client.release();
  }
};

export const verifyInvitation = async (
  req,
  res
) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM invitations
       WHERE token = $1
       AND accepted = FALSE
       AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid invitation",
      });
    }

    return res.status(200).json({
      email: result.rows[0].email,
      role: result.rows[0].role,
    });
  } catch {
    return res.status(500).json({
      message: "Failed to verify invitation",
    });
  }
};

export const completeRegistration =
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { token } = req.params;

      const {
        name,
        phone,
        branch,
        password,
      } = req.body;

      await client.query("BEGIN");

      const inviteResult =
        await client.query(
          `SELECT *
           FROM invitations
           WHERE token = $1
           AND accepted = FALSE
           AND expires_at > NOW()`,
          [token]
        );

      if (
        inviteResult.rows.length === 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Invalid invitation",
        });
      }

      const invite =
        inviteResult.rows[0];

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const userResult =
        await client.query(
          `INSERT INTO users
           (
             email,
             password_hash,
             role
           )
           VALUES
           (
             $1,
             $2,
             $3
           )
           RETURNING id`,
          [
            invite.email,
            hashedPassword,
            invite.role,
          ]
        );

      const userId =
        userResult.rows[0].id;

      if (invite.role === "tpc") {
        await client.query(
          `INSERT INTO tpc
           (
             user_id,
             name,
             email,
             phone,
             branch
           )
           VALUES
           (
             $1,$2,$3,$4,$5
           )`,
          [
            userId,
            name,
            invite.email,
            phone,
            branch,
          ]
        );
      }

      await client.query(
        `UPDATE invitations
         SET accepted = TRUE
         WHERE token = $1`,
        [token]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        message:
          "Registration completed",
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(error);

      return res.status(500).json({
        message:
          "Failed to complete registration",
      });
    } finally {
      client.release();
    }
  };
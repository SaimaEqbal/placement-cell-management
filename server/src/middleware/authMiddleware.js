// CHANGE: Added missing imports for jwt and pool.
// PROBLEM: jwt and pool were used in auth() but never imported, causing
//          ReferenceError: jwt is not defined on every call → always 401.
// BEFORE:  (no imports)
// AFTER:   imports added below.
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const auth = async (req, res, next) => {
  const token =
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    const result = await pool.query(
      `SELECT id, role
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    req.user = {
      userId: result.rows[0].id,
      role: result.rows[0].role
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};
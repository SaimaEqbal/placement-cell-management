import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/**
 * Authenticate a request from its `Authorization: Bearer <token>` header and
 * attach `{ userId, role }` to req.user. A malformed/expired token is a 401;
 * a database failure while loading the user is a 500 (so the two are no longer
 * conflated under a single generic 401).
 */
export const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, role
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = {
      userId: result.rows[0].id,
      role: result.rows[0].role,
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Authentication failed due to a server error.",
    });
  }
};

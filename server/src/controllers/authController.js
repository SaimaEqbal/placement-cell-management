// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import pool from "../config/db.js";
// import { sendVerificationEmail,sendPasswordResetEmail } from "../services/emailService.js";

// export const signup = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // if (!email?.endsWith("@st.jmi.ac.in")) {
//     //   return res.status(400).json({
//     //     message: "Use your college email",
//     //   });
//     // }

//     const existingUser = await pool.query(
//       "SELECT id FROM users WHERE email = $1",
//       [email]
//     );

//     if (existingUser.rows.length > 0) {
//       return res.status(409).json({
//         message: "Email already registered",
//       });
//     }

//     const passwordHash = await bcrypt.hash(password, 12);

//     const verificationToken = jwt.sign(
//       {
//         email,
//         purpose: "email_verification",
//       },
//       process.env.JWT_EMAIL_SECRET,
//       {
//         expiresIn: "24h",
//       }
//     );

//     // Throws if email fails
//     await sendVerificationEmail(
//       email,
//       verificationToken
//     );

//     const user = await pool.query(
//       `INSERT INTO users (
//         email,
//         password_hash
//       )
//       VALUES ($1, $2)
//       RETURNING id, email`,
//       [email, passwordHash]
//     );

//       await pool.query(
//       `INSERT INTO students (
//         email
//       )
//       VALUES ($1)`,
//       [user.rows[0].email]
// );

//     return res.status(201).json({
//       message: "Verification email sent",
//       user: user.rows[0],
//     });

//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message:
//         error.message ||
//         "Failed to create account",
//     });
//   }
// };

// export const verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.query;

//     const payload = jwt.verify(
//       token,
//       process.env.JWT_EMAIL_SECRET
//     );

//     if (payload.purpose !== "email_verification") {
//       return res.status(400).json({
//         message: "Invalid token",
//       });
//     }

//     const result = await pool.query(
//       `UPDATE users
//        SET is_verified = TRUE
//        WHERE email = $1
//        RETURNING id`,
//       [payload.email]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     return res.json({
//       message: "Email verified successfully",
//     });
//   } catch (error) {
//     return res.status(400).json({
//       message: "Verification link expired or invalid",
//     });
//   }
// };

// export const resendVerification = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const result = await pool.query(
//       `SELECT id, email, is_verified
//        FROM users
//        WHERE email = $1`,
//       [email]
//     );

//     const user = result.rows[0];

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     if (user.is_verified) {
//       return res.status(400).json({
//         message: "Email already verified",
//       });
//     }

//     const verificationToken = jwt.sign(
//       {
//         userId: user.id,
//         email:user.email,
//         purpose: "email_verification",
//       },
//       process.env.JWT_EMAIL_SECRET,
//       {
//         expiresIn: "24h",
//       }
//     );

//     await sendVerificationEmail(
//       user.email,
//       verificationToken
//     );

//     return res.json({
//       message: "Verification email sent",
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const result = await pool.query(
//       `SELECT *
//        FROM users
//        WHERE email = $1`,
//       [email]
//     );

//     const user = result.rows[0];

//     if (!user) {
//       return res.status(401).json({
//         message: "Invalid credentials",
//       });
//     }

//     const validPassword = await bcrypt.compare(
//       password,
//       user.password_hash
//     );

//     if (!validPassword) {
//       return res.status(401).json({
//         message: "Invalid credentials",
//       });
//     }

//     if (!user.is_verified) {
//       return res.status(403).json({
//         message: "Verify your email first",
//       });
//     }

//     const accessToken = jwt.sign(
//       {
//         userId: user.id,
//         role: user.role,
//         email:user.email,
//       },
//       process.env.JWT_ACCESS_SECRET,
//       {
//         expiresIn: "7d",
//       }
//     );

//     return res.json({
//       token: accessToken,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const result = await pool.query(
//       `SELECT id, email
//        FROM users
//        WHERE email = $1
//        AND is_verified = TRUE`,
//       [email]
//     );

//     const user = result.rows[0];

//     if (!user) {
//       return res.status(200).json({
//         message: "If the email exists, a reset link has been sent",
//       });
//     }

//     const resetToken = jwt.sign(
//       {
//         userId: user.id,
//         purpose: "password_reset",
//       },
//       process.env.JWT_EMAIL_SECRET,
//       {
//         expiresIn: "15m",
//       }
//     );

//     await sendPasswordResetEmail(
//       user.email,
//       resetToken
//     );

//     return res.status(200).json({
//       message: "If the email exists, a reset link has been sent",
//     });

//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       message: "Failed to process request",
//     });
//   }
// };

// export const resetPassword = async (req, res) => {
//   const { token, password } = req.body;

//   const payload = jwt.verify(
//     token,
//     process.env.JWT_EMAIL_SECRET
//   );

//   if (payload.purpose !== "password_reset") {
//     return res.status(400).json({
//       message: "Invalid token",
//     });
//   }

//   const hash = await bcrypt.hash(password, 12);

//   await pool.query(
//     `UPDATE users
//      SET password_hash = $1
//      WHERE id = $2`,
//     [hash, payload.userId]
//   );

//   return res.json({
//     message: "Password reset successful",
//   });
// };

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { sendVerificationEmail,sendPasswordResetEmail } from "../services/emailService.js";

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const verificationToken = jwt.sign(
      {
        email,
        purpose: "email_verification",
      },
      process.env.JWT_EMAIL_SECRET,
      {
        expiresIn: "24h",
      }
    );

    // Throws if email fails
    await sendVerificationEmail(
      email,
      verificationToken
    );

    const user = await pool.query(
      `INSERT INTO users (
        email,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING id, email`,
      [email, passwordHash]
    );

    return res.status(201).json({
      message: "Verification email sent",
      user: user.rows[0],
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        error.message ||
        "Failed to create account",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const payload = jwt.verify(
      token,
      process.env.JWT_EMAIL_SECRET
    );

    if (payload.purpose !== "email_verification") {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    /*OLD: const result = await pool.query(
      `UPDATE users
       SET is_verified = TRUE
       WHERE id = $1
       RETURNING id`,
      [payload.userId]
    );*/

// Signup tokens currently store `email` rather than `userId`.
// See signup(): the verification JWT payload is
// { email, purpose: "email_verification" }.
//
// Because of that, payload.userId is undefined during email verification.
// Match the user by email instead so accounts created through signup
// can be verified successfully.
const result = await pool.query(
  `UPDATE users
   SET is_verified = TRUE
   WHERE email = $1
   RETURNING id`,
  [payload.email]
);
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Verification link expired or invalid",
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      `SELECT id, email, is_verified
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        message: "Email already verified",
      });
    }

    const verificationToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        purpose: "email_verification",
      },
      process.env.JWT_EMAIL_SECRET,
      {
        expiresIn: "24h",
      }
    );

    await sendVerificationEmail(
      user.email,
      verificationToken
    );

    return res.json({
      message: "Verification email sent",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Verify your email first",
      });
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      token: accessToken,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      `SELECT id, email
       FROM users
       WHERE email = $1
       AND is_verified = TRUE`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(200).json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = jwt.sign(
      {
        userId: user.id,
        purpose: "password_reset",
      },
      process.env.JWT_EMAIL_SECRET,
      {
        expiresIn: "15m",
      }
    );

    await sendPasswordResetEmail(
      user.email,
      resetToken
    );

    return res.status(200).json({
      message: "If the email exists, a reset link has been sent",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to process request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_EMAIL_SECRET
    );

    if (payload.purpose !== "password_reset") {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [hash, payload.userId]
    );

    return res.json({
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Reset link expired or invalid",
    });
  }
};


// GET /auth/admins - every admin account (Admin roster view). Users only carry
// an email (no name), so the roster shows email + verification + created date.
export const getAllAdmins = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, is_verified, created_at
       FROM users
       WHERE role = 'admin'
       ORDER BY created_at`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch admins" });
  }
};

import express from "express";
import {
  signup,
  verifyEmail,
  login,
  resendVerification,
  forgotPassword,
  resetPassword,
  getAllAdmins
} from "../controllers/authController.js";
import { auth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Admin roster: every admin account (Admin only).
router.get("/admins", auth, requireAdmin, getAllAdmins);

export default router;
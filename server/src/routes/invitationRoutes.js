import express from "express";

import { auth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

import {
  sendInvitation,
  verifyInvitation,
  completeRegistration,
  updateUserRole
} from "../controllers/invitationController.js";

const router = express.Router();

router.post(
  "/invite",
  auth,
  requireAdmin,
  sendInvitation
);

router.get(
  "/verify/:token",
  verifyInvitation
);

router.post(
  "/complete/:token",
  completeRegistration
);

router.patch(
  "/users/:userId/role",
  auth,
  requireAdmin,
  updateUserRole
);

export default router;
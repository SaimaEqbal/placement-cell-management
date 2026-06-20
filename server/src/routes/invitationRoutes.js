import express from "express";

import { auth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

import {
  sendInvitation,
  verifyInvitation,
  completeRegistration,
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

export default router;
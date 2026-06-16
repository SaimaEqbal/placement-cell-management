import express from "express";
import { auth } from "../middleware/authMiddleware.js";

import {
  applyForDrive,
  withdrawApplication,
  getMyApplications
} from "../controllers/applicationController.js";

import { validateApplyForDrive } from "../middleware/applicationMiddleware.js";
const router = express.Router();

router.post(
  "/apply/:driveId",
  auth,
  validateApplyForDrive,
  applyForDrive
);

router.delete(
  "/:applicationId",
  auth,
  withdrawApplication
);

router.get(
  "/student/:studentId",
  auth,
  getMyApplications
);

export default router;
import express from "express";

import { auth } from "../middleware/authMiddleware.js";
import {
  requireAdminTPC,
  requireAdmin,
  requireAdminTPCSPC
} from "../middleware/roleMiddleware.js";

import {
  validateCreateDrive,
  validateUpdateDrive,
  validateUpdateStudentRound
} from "../middleware/driveMiddleware.js";

import {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
  getAppliedStudents,
  approveApplication,
  rejectApplication,
  updateStudentRound,
  markStudentSelected,
  markStudentRejected,
  getDriveResults,
} from "../controllers/driveController.js";

const router = express.Router();

router.post(
  "/",
  auth,
  requireAdmin,
  validateCreateDrive,
  createDrive
);

router.get(
  "/",
  auth,
  getDrives
);

router.get(
  "/:driveId",
  auth,
  getDriveById
);

router.put(
  "/:driveId",
  auth,
  requireAdmin,
  validateUpdateDrive,
  updateDrive
);

router.delete(
  "/:driveId",
  auth,
  requireAdmin,
  deleteDrive
);

router.get(
  "/:driveId/applications",
  auth,
  requireAdminTPCSPC,
  getAppliedStudents
);

router.put(
  "/applications/:applicationId/approve",
  auth,
  requireAdminTPC,
  approveApplication
);

router.put(
  "/applications/:applicationId/reject",
  auth,
  requireAdminTPC,
  rejectApplication
);

router.put(
  "/applications/:applicationId/round",
  auth,
  requireAdminTPCSPC,
  validateUpdateStudentRound,
  updateStudentRound
);

router.put(
  "/applications/:applicationId/select",
  auth,
  requireAdminTPC,
  markStudentSelected
);

router.put(
  "/applications/:applicationId/not-select",
  auth,
  requireAdminTPC,
  markStudentRejected
);

router.get(
  "/:driveId/results",
  auth,
  requireAdminTPCSPC,
  getDriveResults
);

export default router;
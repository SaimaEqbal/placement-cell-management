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
  getDriveStudents,
  confirmStudents,
  markRejected,
  markSelected,
  removeStudent,
  updateStudentRound,
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
  "/:driveId/students",
  auth,
  getDriveStudents
);

router.post(
  "/:driveId/confirm-students",
  auth,
  requireAdmin,
  confirmStudents
);

router.patch(
  "/students/:driveStudentId/round",
  auth,
  requireAdmin,
  updateStudentRound
);

router.patch(
  "/students/:driveStudentId/select",
  auth,
  requireAdmin,
  markSelected
);

router.patch(
  "/students/:driveStudentId/reject",
  auth,
  requireAdmin,
  markRejected
);

router.delete(
  "/students/:driveStudentId",
  auth,
  requireAdmin,
  removeStudent
);

export default router;

// router.get(
//   "/:driveId/applications",
//   auth,
//   requireAdminTPCSPC,
//   getAppliedStudents
// );

// router.put(
//   "/applications/:applicationId/approve",
//   auth,
//   requireAdminTPC,
//   approveApplication
// );

// router.put(
//   "/applications/:applicationId/reject",
//   auth,
//   requireAdminTPC,
//   rejectApplication
// );

// router.put(
//   "/applications/:applicationId/round",
//   auth,
//   requireAdminTPCSPC,
//   validateUpdateStudentRound,
//   updateStudentRound
// );

// router.put(
//   "/applications/:applicationId/select",
//   auth,
//   requireAdminTPC,
//   markStudentSelected
// );

// router.put(
//   "/applications/:applicationId/not-select",
//   auth,
//   requireAdminTPC,
//   markStudentRejected
// );

// router.get(
//   "/:driveId/results",
//   auth,
//   requireAdminTPCSPC,
//   getDriveResults
// );



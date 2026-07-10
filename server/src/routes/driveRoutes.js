import express from "express";

import { auth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

import {
  validateCreateDrive,
  validateUpdateDrive,
  validatePrefilter,
  validateAttendance,
  validateResult,
  validateRoundDate,
} from "../middleware/driveMiddleware.js";

import {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
  getDriveStudents,
  confirmStudents,
  startRoundZero,
  finalizePrefilter,
  finalizeAttendance,
  advanceRound,
  completeDrive,
  prefilterRemove,
  markAttendance,
  recordResult,
  getRoundHistory,
  getDriveRounds,
  setRoundDate,
  getMyDrives,
  getMyDriveResults,
} from "../controllers/driveController.js";

const router = express.Router();

// --- Drive CRUD ------------------------------------------------------------
router.post("/", auth, requireAdmin, validateCreateDrive, createDrive);
router.get("/", auth, getDrives);
// Static routes must precede the "/:driveId" param route so "/my-drives" matches.
router.get("/my-drives", auth, getMyDrives);
router.get("/:driveId", auth, getDriveById);
router.put("/:driveId", auth, requireAdmin, validateUpdateDrive, updateDrive);
router.delete("/:driveId", auth, requireAdmin, deleteDrive);

// --- Shortlist -------------------------------------------------------------
router.get("/:driveId/students", auth, getDriveStudents);
router.post("/:driveId/confirm-students", auth, requireAdmin, confirmStudents);

// --- Round-workflow transitions -------------------------------------------
router.post("/:driveId/start-round-0", auth, requireAdmin, startRoundZero);
router.post("/:driveId/finalize-prefilter", auth, requireAdmin, finalizePrefilter);
router.post("/:driveId/finalize-attendance", auth, requireAdmin, finalizeAttendance);
router.post("/:driveId/advance-round", auth, requireAdmin, advanceRound);
router.post("/:driveId/complete", auth, requireAdmin, completeDrive);

// --- Per-student round actions (nested so the parent drive state is checked) --
router.patch(
  "/:driveId/students/:driveStudentId/prefilter",
  auth,
  requireAdmin,
  validatePrefilter,
  prefilterRemove
);
router.patch(
  "/:driveId/students/:driveStudentId/attendance",
  auth,
  requireAdmin,
  validateAttendance,
  markAttendance
);
router.patch(
  "/:driveId/students/:driveStudentId/result",
  auth,
  requireAdmin,
  validateResult,
  recordResult
);

// --- Per-round dates -------------------------------------------------------
router.get("/:driveId/rounds", auth, getDriveRounds);
router.patch(
  "/:driveId/rounds/:roundNo/date",
  auth,
  requireAdmin,
  validateRoundDate,
  setRoundDate
);

// --- History ---------------------------------------------------------------
router.get("/:driveId/history", auth, getRoundHistory);

// --- Student self-scoped reads ---------------------------------------------
router.get("/:driveId/my-results", auth, getMyDriveResults);

export default router;

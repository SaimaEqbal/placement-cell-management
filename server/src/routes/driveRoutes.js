import express from "express";

import { auth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

import {
  validateCreateDrive,
  validateUpdateDrive,
  validateAttendance,
  validateRoundDate,
  validatePrefilterFinalize,
  validateRoundResolve,
} from "../middleware/driveMiddleware.js";

import {
  createDrive,
  getDrives,
  getDriveById,
  getDriveEligible,
  updateDrive,
  deleteDrive,
  getDriveStudents,
  confirmStudents,
  startRoundZero,
  finalizePrefilter,
  finalizeAttendance,
  advanceRound,
  completeDrive,
  markAttendance,
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
router.get("/:driveId/eligible", auth, requireAdmin, getDriveEligible);
router.put("/:driveId", auth, requireAdmin, validateUpdateDrive, updateDrive);
router.delete("/:driveId", auth, requireAdmin, deleteDrive);

// --- Shortlist -------------------------------------------------------------
router.get("/:driveId/students", auth, getDriveStudents);
router.post("/:driveId/confirm-students", auth, requireAdmin, confirmStudents);

// --- Round-workflow transitions -------------------------------------------
router.post("/:driveId/start-round-0", auth, requireAdmin, startRoundZero);
router.post("/:driveId/finalize-prefilter", auth, requireAdmin, validatePrefilterFinalize, finalizePrefilter);
router.post("/:driveId/finalize-attendance", auth, requireAdmin, finalizeAttendance);
router.post("/:driveId/advance-round", auth, requireAdmin, validateRoundResolve, advanceRound);
router.post("/:driveId/complete", auth, requireAdmin, validateRoundResolve, completeDrive);

// --- Per-student round actions (nested so the parent drive state is checked) --
// Prefilter removals and round results are committed in batch at the stage
// finalize endpoints (finalize-prefilter / advance-round / complete); attendance
// is the only remaining per-student toggle.
router.patch(
  "/:driveId/students/:driveStudentId/attendance",
  auth,
  requireAdmin,
  validateAttendance,
  markAttendance
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

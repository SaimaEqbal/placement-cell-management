import express from "express";
import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getMyProfile,
  upsertMyProfile,
} from "../controllers/studentController.js";
import {
  validateCreateStudent,
  validateUpdateStudent,
  validateUpdateMyProfile,
} from "../middleware/studentMiddleware.js";
import { auth } from "../middleware/authMiddleware.js";
import { requireAdminTPC, requireAdminTPCSPC } from "../middleware/roleMiddleware.js";

const router = express.Router();

// --- Static /me routes MUST precede the "/:id" param routes -------------------

// Self-service profile: read + partial upsert (the 4-part wizard).
router.get("/me", auth, getMyProfile);
router.put("/me", auth, validateUpdateMyProfile, upsertMyProfile);

// --- List / create ------------------------------------------------------------
router.get("/", auth, requireAdminTPCSPC, getStudents);
router.post("/", auth, validateCreateStudent, createStudent);

// --- Single student by id ------------------------------------------------------
router.get("/:id", auth, requireAdminTPCSPC, getStudentById);
// Staff edit only; students edit their own profile via PUT /me.
router.put("/:id", auth, requireAdminTPC, validateUpdateStudent, updateStudent);
router.delete("/:id", auth, requireAdminTPC, deleteStudent);

export default router;

import express from "express";
import { getStudents,createStudent,getStudentById,updateStudent,deleteStudent,getMyProfile } from "../controllers/studentController.js";
import { validateCreateStudent,validateUpdateStudent } from "../middleware/studentMiddleware.js";
import {auth} from "../middleware/authMiddleware.js";
// CHANGE: Added requireAdmin and requireAdminTPC to the role-middleware import.
// PROBLEM: Only requireSPC was imported, but the access-control fixes below
//          need requireAdminTPC (list/read students) and requireAdmin (delete).
// BEFORE:  import { requireSPC } from "../middleware/roleMiddleware.js";
// AFTER:   line below also imports requireAdmin and requireAdminTPC.
import { requireSPC, requireAdmin, requireAdminTPC } from "../middleware/roleMiddleware.js";
const router = express.Router();

// CHANGE: Added `auth, requireAdminTPC` to GET / (list all students).
// PROBLEM: Route had no middleware, so any anonymous client could read the
//          full students table (all PII) without a token. (SEC-04)
// BEFORE:  router.get("/", getStudents);
// AFTER:   only authenticated admin/TPC users can list students.
router.get("/", auth, requireAdminTPC, getStudents);
router.get(
  "/me",
  auth,
  getMyProfile
);
// CHANGE: Added `auth` to POST / (create student profile).
// PROBLEM: Route had no middleware, so anyone could insert arbitrary student
//          records without logging in. (SEC-04)
// BEFORE:  router.post("/", validateCreateStudent, createStudent);
// AFTER:   caller must be authenticated. NOTE: ownership/user_id linkage must
//          still be enforced in createStudent (controller inserts no user_id yet).
router.post(
  "/",
  auth,
  validateCreateStudent,
  createStudent
);

// CHANGE: Added `auth` to PUT /:id (update student).
// PROBLEM: Route had no middleware, so anyone could overwrite any student's
//          record without a token. (SEC-04)
// BEFORE:  router.put("/:id", validateUpdateStudent, updateStudent);
// AFTER:   caller must be authenticated. Left at `auth` only (no role guard)
//          because students legitimately edit their OWN profile here
//          (frontend CompleteProfilePage -> PUT /students/:id); a per-record
//          ownership check (own row, or admin/spc/tpc) belongs in the
//          controller and is documented as a follow-up rather than a route
//          role guard that would lock students out of their own profile.
router.put(
  "/:id",
  auth,
  validateUpdateStudent,
  updateStudent
);


// CHANGE: Added `auth, requireAdminTPC` to GET /:id (read one student).
// PROBLEM: Route had no middleware, so anyone could read any student record
//          (PII) by id without a token. (SEC-04)
// BEFORE:  router.get("/:id", getStudentById);
// AFTER:   only authenticated admin/TPC users can read an arbitrary student.
router.get("/:id", auth, requireAdminTPC, getStudentById);
// CHANGE: Added `auth, requireAdmin` to DELETE /:id (delete student).
// PROBLEM: Route had no middleware, so anyone could delete any student. (SEC-04)
// BEFORE:  router.delete("/:id", deleteStudent);
// AFTER:   only authenticated admins can delete a student record.
router.delete("/:id", auth, requireAdmin, deleteStudent);

export default router;
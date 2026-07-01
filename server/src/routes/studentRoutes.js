import express from "express";
import { getStudents,createStudent,getStudentById,updateStudent,deleteStudent,getMyProfile } from "../controllers/studentController.js";
import { validateCreateStudent,validateUpdateStudent } from "../middleware/studentMiddleware.js";
import {auth} from "../middleware/authMiddleware.js";
import { requireAdmin, requireAdminTPCSPC } from "../middleware/roleMiddleware.js";

const router = express.Router();

// CHANGE: GET / and GET /:id now use requireAdminTPCSPC (was requireAdminTPC).
// PROBLEM: the SPC screens (roster + verification detail) read the student list
//          and a single student to do their review, but requireAdminTPC returned
//          403 "Admin or TPC access required" for SPCs.
// FIX:     widen READ access to admin/TPC/SPC. SPC writes remain limited to
//          PUT /spc/:id (requireSPC); DELETE stays admin-only.
router.get("/", auth, requireAdminTPCSPC, getStudents);

router.get("/me", auth, getMyProfile);

router.post("/", auth, validateCreateStudent, createStudent);

router.put("/:id", auth, validateUpdateStudent, updateStudent);

router.get("/:id", auth, requireAdminTPCSPC, getStudentById);

router.delete("/:id", auth, requireAdmin, deleteStudent);

export default router;

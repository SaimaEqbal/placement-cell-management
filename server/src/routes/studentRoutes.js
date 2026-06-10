import express from "express";
import { getStudents,createStudent,getStudentById,updateStudent,deleteStudent } from "../controllers/studentController.js";
import { validateCreateStudent } from "../middleware/createStudent.js";
import { validateUpdateStudent } from "../middleware/updateStudent.js";

const router = express.Router();

router.get("/", getStudents);
router.post(
  "/students",
  validateCreateStudent,
  createStudent
);

router.put(
  "/students/:id",
  validateUpdateStudent,
  updateStudent
);
router.get("/:id", getStudentById);
router.delete("/:id",deleteStudent);

export default router;
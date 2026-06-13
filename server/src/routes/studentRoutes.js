import express from "express";
import { getStudents,createStudent,getStudentById,updateStudent,deleteStudent,getMyProfile } from "../controllers/studentController.js";
import { validateCreateStudent,validateUpdateStudent } from "../middleware/studentMiddleware.js";
import {auth} from "../middleware/authMiddleware.js";
import { requireSPC } from "../middleware/roleMiddleware.js";
const router = express.Router();

router.get("/", getStudents);
router.get(
  "/me",
  auth,
  getMyProfile
);
router.post(
  "/",
  validateCreateStudent,
  createStudent
);

router.put(
  "/:id",
  validateUpdateStudent,
  updateStudent
);


router.get("/:id", getStudentById);
router.delete("/:id",deleteStudent);

export default router;
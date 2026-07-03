import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { requireSPC } from "../middleware/roleMiddleware.js";
import {
  getSpcQueue,
  spcVerifyStudent,
  spcRejectStudent,
} from "../controllers/spcController.js";

const router = express.Router();

// The SPC only has verification duties (they are otherwise a normal student).
// The queue is their assigned + still-pending students; verify/reject act on a
// single assigned student.
router.get("/verification-queue", auth, requireSPC, getSpcQueue);
router.put("/verify/:studentId", auth, requireSPC, spcVerifyStudent);
router.put("/reject/:studentId", auth, requireSPC, spcRejectStudent);

export default router;
